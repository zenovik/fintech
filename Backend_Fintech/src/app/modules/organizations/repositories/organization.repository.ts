import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import {
  BillingBodyDto,
  BrandingBodyDto,
  CreateApiKeyBodyDto,
  CreateDomainBodyDto,
  CreateMemberBodyDto,
  CreateOrganizationBodyDto,
  OrganizationListQueryDto,
  UpdateDomainBodyDto,
  UpdateMemberBodyDto,
  UpdateOrganizationBodyDto,
} from '../dto';

type Row = RowDataPacket & Record<string, unknown>;

function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { return fallback; }
  }
  return value as T;
}

function mapOrg(row: Row) {
  return {
    id: row['id'] as number,
    uuid: row['uuid'] as string,
    code: row['code'] as string,
    legalName: row['legal_name'] as string,
    displayName: row['display_name'] as string,
    dbaName: row['dba_name'] as string | null,
    taxId: row['tax_id'] as string | null,
    industry: row['industry'] as string | null,
    website: row['website'] as string | null,
    status: row['status'] as string,
    logoUrl: row['logo_url'] as string | null,
    logoInitials: row['logo_initials'] as string | null,
    primaryColor: row['primary_color'] as string | null,
    baseCurrency: row['base_currency'] as string,
    timezone: row['timezone'] as string,
    locale: row['locale'] as string,
    primaryRegion: row['primary_region'] as string | null,
    description: row['description'] as string | null,
    archivedAt: row['archived_at'] as string | null,
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string,
    memberCount: row['member_count'] != null ? Number(row['member_count']) : undefined,
  };
}

export class OrganizationRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async findAll(query: OrganizationListQueryDto) {
    const conditions: string[] = ['1=1'];
    const params: unknown[] = [];
    if (query.search) {
      conditions.push('(o.display_name LIKE ? OR o.legal_name LIKE ? OR o.code LIKE ? OR o.tax_id LIKE ?)');
      const term = `%${query.search}%`;
      params.push(term, term, term, term);
    }
    if (query.status) { conditions.push('o.status = ?'); params.push(query.status); }
    const where = `WHERE ${conditions.join(' AND ')}`;
    const sortCol = ['created_at', 'display_name', 'legal_name', 'status'].includes(query.sortBy)
      ? query.sortBy : 'created_at';
    const order = query.sortOrder === 'asc' ? 'ASC' : 'DESC';
    const offset = (query.page - 1) * query.pageSize;

    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM organizations o ${where}`, params,
    );
    const total = Number(countRows[0]?.total ?? 0);
    const [rows] = await this.pool.query<Row[]>(
      `SELECT o.*, (SELECT COUNT(*) FROM organization_members m WHERE m.organization_id = o.id AND m.status = 'active') AS member_count
       FROM organizations o ${where} ORDER BY o.${sortCol} ${order} LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows.map(mapOrg), total, page: query.page, pageSize: query.pageSize };
  }

  async findById(id: number) {
    const [rows] = await this.pool.query<Row[]>(`SELECT * FROM organizations WHERE id = ?`, [id]);
    if (!rows[0]) return null;
    const org = mapOrg(rows[0]);
    const [addresses, contacts, domains, members, branding, preferences, apiKeys, billing] = await Promise.all([
      this.getAddresses(id),
      this.getContacts(id),
      this.getDomains(id),
      this.getMembers(id),
      this.getBranding(id),
      this.getPreferences(id),
      this.getApiKeys(id),
      this.getBilling(id),
    ]);
    return { ...org, addresses, contacts, domains, members, branding, preferences, apiKeys, billing };
  }

  async findMembershipsByUserId(userId: number) {
    const [rows] = await this.pool.query<Row[]>(
      `SELECT o.id, o.uuid, o.code, o.display_name, o.legal_name, o.status, o.logo_initials, o.primary_color,
              m.is_default, m.status AS membership_status, r.code AS role_code, r.name AS role_name
       FROM organization_members m
       JOIN organizations o ON o.id = m.organization_id
       JOIN organization_roles r ON r.id = m.org_role_id
       WHERE m.user_id = ? AND m.status IN ('active','invited') AND o.status != 'archived'
       ORDER BY m.is_default DESC, o.display_name ASC`,
      [userId],
    );
    return rows.map((r) => ({
      id: r['id'] as number,
      uuid: r['uuid'] as string,
      code: r['code'] as string,
      displayName: r['display_name'] as string,
      legalName: r['legal_name'] as string,
      status: r['status'] as string,
      logoInitials: r['logo_initials'] as string | null,
      primaryColor: r['primary_color'] as string | null,
      isDefault: Boolean(r['is_default']),
      membershipStatus: r['membership_status'] as string,
      roleCode: r['role_code'] as string,
      roleName: r['role_name'] as string,
    }));
  }

  async create(dto: CreateOrganizationBodyDto, actorId?: number) {
    const uuid = randomUUID();
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO organizations (uuid, code, legal_name, display_name, dba_name, tax_id, industry, website, status,
        logo_url, logo_initials, primary_color, base_currency, timezone, locale, primary_region, description, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuid, dto.code, dto.legalName, dto.displayName, dto.dbaName ?? null, dto.taxId ?? null,
        dto.industry ?? null, dto.website || null, dto.status ?? 'pending',
        dto.logoUrl ?? null, dto.logoInitials ?? dto.displayName.slice(0, 2).toUpperCase(),
        dto.primaryColor ?? '#003ec7', dto.baseCurrency ?? 'USD', dto.timezone ?? 'UTC',
        dto.locale ?? 'en-US', dto.primaryRegion ?? null, dto.description ?? null, actorId ?? null, actorId ?? null,
      ],
    );
    const orgId = result.insertId;

    await this.pool.query(
      `INSERT INTO organization_branding (uuid, organization_id, company_name, logo_url, logo_initials, primary_color, secondary_color, accent_color, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, '#1e40af', '#22c55e', ?)`,
      [randomUUID(), orgId, dto.displayName, dto.logoUrl ?? null, dto.logoInitials ?? dto.displayName.slice(0, 2).toUpperCase(), dto.primaryColor ?? '#003ec7', actorId ?? null],
    );
    await this.pool.query(
      `INSERT INTO organization_billing (uuid, organization_id, plan_code, plan_name, billing_email, status, currency, amount, updated_by)
       VALUES (?, ?, 'starter', 'Starter', NULL, 'trialing', ?, 0, ?)`,
      [randomUUID(), orgId, dto.baseCurrency ?? 'USD', actorId ?? null],
    );

    if (dto.addresses?.length) {
      for (const a of dto.addresses) {
        await this.pool.query(
          `INSERT INTO organization_addresses (uuid, organization_id, address_type, line1, line2, city, state_province, postal_code, country_code, is_primary)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [randomUUID(), orgId, a.addressType, a.line1, a.line2 ?? null, a.city, a.stateProvince ?? null, a.postalCode ?? null, a.countryCode ?? 'US', a.isPrimary ? 1 : 0],
        );
      }
    }
    if (dto.contacts?.length) {
      for (const c of dto.contacts) {
        await this.pool.query(
          `INSERT INTO organization_contacts (uuid, organization_id, contact_type, first_name, last_name, email, phone, job_title, is_primary)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [randomUUID(), orgId, c.contactType, c.firstName, c.lastName, c.email, c.phone ?? null, c.jobTitle ?? null, c.isPrimary ? 1 : 0],
        );
      }
    }

    if (actorId) {
      const [roleRows] = await this.pool.query<Row[]>(
        `SELECT id FROM organization_roles WHERE code = 'owner' AND organization_id IS NULL LIMIT 1`,
      );
      const roleId = Number(roleRows[0]?.['id'] ?? 1);
      await this.pool.query(
        `INSERT INTO organization_members (uuid, organization_id, user_id, org_role_id, status, is_default, joined_at)
         VALUES (?, ?, ?, ?, 'active', 1, NOW(6))`,
        [randomUUID(), orgId, actorId, roleId],
      );
    }

    return this.findById(orgId);
  }

  async update(id: number, dto: UpdateOrganizationBodyDto, actorId?: number) {
    const fields: string[] = [];
    const params: unknown[] = [];
    const map: Record<string, unknown> = {
      legal_name: dto.legalName, display_name: dto.displayName, dba_name: dto.dbaName,
      tax_id: dto.taxId, industry: dto.industry, website: dto.website || null,
      status: dto.status, logo_url: dto.logoUrl, logo_initials: dto.logoInitials,
      primary_color: dto.primaryColor, base_currency: dto.baseCurrency, timezone: dto.timezone,
      locale: dto.locale, primary_region: dto.primaryRegion, description: dto.description,
    };
    for (const [col, val] of Object.entries(map)) {
      if (val !== undefined) { fields.push(`${col} = ?`); params.push(val); }
    }
    if (!fields.length) return this.findById(id);
    fields.push('updated_by = ?');
    params.push(actorId ?? null);
    params.push(id);
    await this.pool.query(`UPDATE organizations SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }

  async updateStatus(id: number, status: string, actorId?: number) {
    const archivedAt = status === 'archived' ? new Date() : null;
    await this.pool.query(
      `UPDATE organizations SET status = ?, archived_at = ?, updated_by = ? WHERE id = ?`,
      [status, archivedAt, actorId ?? null, id],
    );
    return this.findById(id);
  }

  async getAddresses(orgId: number) {
    const [rows] = await this.pool.query<Row[]>(
      `SELECT * FROM organization_addresses WHERE organization_id = ? ORDER BY is_primary DESC, id`, [orgId],
    );
    return rows.map((r) => ({
      id: r['id'] as number, uuid: r['uuid'] as string, addressType: r['address_type'] as string,
      line1: r['line1'] as string, line2: r['line2'] as string | null, city: r['city'] as string,
      stateProvince: r['state_province'] as string | null, postalCode: r['postal_code'] as string | null,
      countryCode: r['country_code'] as string, isPrimary: Boolean(r['is_primary']),
    }));
  }

  async getContacts(orgId: number) {
    const [rows] = await this.pool.query<Row[]>(
      `SELECT * FROM organization_contacts WHERE organization_id = ? ORDER BY is_primary DESC, id`, [orgId],
    );
    return rows.map((r) => ({
      id: r['id'] as number, uuid: r['uuid'] as string, contactType: r['contact_type'] as string,
      firstName: r['first_name'] as string, lastName: r['last_name'] as string,
      email: r['email'] as string, phone: r['phone'] as string | null,
      jobTitle: r['job_title'] as string | null, isPrimary: Boolean(r['is_primary']),
    }));
  }

  async getDomains(orgId: number) {
    const [rows] = await this.pool.query<Row[]>(
      `SELECT * FROM organization_domains WHERE organization_id = ? ORDER BY is_primary DESC, id`, [orgId],
    );
    return rows.map((r) => ({
      id: r['id'] as number, uuid: r['uuid'] as string, domain: r['domain'] as string,
      isPrimary: Boolean(r['is_primary']), isVerified: Boolean(r['is_verified']),
      status: r['status'] as string, verifiedAt: r['verified_at'] as string | null,
      createdAt: r['created_at'] as string,
    }));
  }

  async addDomain(orgId: number, dto: CreateDomainBodyDto) {
    if (dto.isPrimary) {
      await this.pool.query(`UPDATE organization_domains SET is_primary = 0 WHERE organization_id = ?`, [orgId]);
    }
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO organization_domains (uuid, organization_id, domain, is_primary, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [randomUUID(), orgId, dto.domain.toLowerCase(), dto.isPrimary ? 1 : 0],
    );
    const domains = await this.getDomains(orgId);
    return domains.find((d) => d.id === result.insertId)!;
  }

  async updateDomain(orgId: number, domainId: number, dto: UpdateDomainBodyDto) {
    if (dto.isPrimary) {
      await this.pool.query(`UPDATE organization_domains SET is_primary = 0 WHERE organization_id = ?`, [orgId]);
    }
    const fields: string[] = [];
    const params: unknown[] = [];
    if (dto.isPrimary !== undefined) { fields.push('is_primary = ?'); params.push(dto.isPrimary ? 1 : 0); }
    if (dto.status !== undefined) {
      fields.push('status = ?'); params.push(dto.status);
      if (dto.status === 'verified') {
        fields.push('is_verified = 1', 'verified_at = NOW(6)');
      }
    }
    if (!fields.length) return null;
    params.push(orgId, domainId);
    await this.pool.query(
      `UPDATE organization_domains SET ${fields.join(', ')} WHERE organization_id = ? AND id = ?`, params,
    );
    const domains = await this.getDomains(orgId);
    return domains.find((d) => d.id === domainId) ?? null;
  }

  async deleteDomain(orgId: number, domainId: number) {
    const [result] = await this.pool.query<ResultSetHeader>(
      `DELETE FROM organization_domains WHERE organization_id = ? AND id = ?`, [orgId, domainId],
    );
    return result.affectedRows > 0;
  }

  async getMembers(orgId: number) {
    const [rows] = await this.pool.query<Row[]>(
      `SELECT m.*, u.email, u.first_name, u.last_name, r.code AS role_code, r.name AS role_name
       FROM organization_members m
       JOIN users u ON u.id = m.user_id
       JOIN organization_roles r ON r.id = m.org_role_id
       WHERE m.organization_id = ? AND m.status != 'removed'
       ORDER BY m.is_default DESC, m.created_at DESC`,
      [orgId],
    );
    return rows.map((r) => ({
      id: r['id'] as number, uuid: r['uuid'] as string, userId: r['user_id'] as number,
      email: r['email'] as string, firstName: r['first_name'] as string, lastName: r['last_name'] as string,
      orgRoleId: r['org_role_id'] as number, roleCode: r['role_code'] as string, roleName: r['role_name'] as string,
      status: r['status'] as string, isDefault: Boolean(r['is_default']),
      joinedAt: r['joined_at'] as string | null, createdAt: r['created_at'] as string,
    }));
  }

  async addMember(orgId: number, dto: CreateMemberBodyDto, invitedBy?: number) {
    if (dto.isDefault) {
      await this.pool.query(
        `UPDATE organization_members SET is_default = 0 WHERE user_id = ?`, [dto.userId],
      );
    }
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO organization_members (uuid, organization_id, user_id, org_role_id, status, is_default, invited_by, joined_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 'active' THEN NOW(6) ELSE NULL END)`,
      [randomUUID(), orgId, dto.userId, dto.orgRoleId, dto.status ?? 'invited', dto.isDefault ? 1 : 0, invitedBy ?? null, dto.status ?? 'invited'],
    );
    const members = await this.getMembers(orgId);
    return members.find((m) => m.id === result.insertId)!;
  }

  async updateMember(orgId: number, memberId: number, dto: UpdateMemberBodyDto) {
    const fields: string[] = [];
    const params: unknown[] = [];
    if (dto.orgRoleId !== undefined) { fields.push('org_role_id = ?'); params.push(dto.orgRoleId); }
    if (dto.status !== undefined) {
      fields.push('status = ?'); params.push(dto.status);
      if (dto.status === 'active') fields.push('joined_at = COALESCE(joined_at, NOW(6))');
    }
    if (dto.isDefault !== undefined) {
      if (dto.isDefault) {
        const [mem] = await this.pool.query<Row[]>(
          `SELECT user_id FROM organization_members WHERE id = ? AND organization_id = ?`, [memberId, orgId],
        );
        if (mem[0]) {
          await this.pool.query(`UPDATE organization_members SET is_default = 0 WHERE user_id = ?`, [mem[0]['user_id']]);
        }
      }
      fields.push('is_default = ?'); params.push(dto.isDefault ? 1 : 0);
    }
    if (!fields.length) return null;
    params.push(orgId, memberId);
    await this.pool.query(
      `UPDATE organization_members SET ${fields.join(', ')} WHERE organization_id = ? AND id = ?`, params,
    );
    const members = await this.getMembers(orgId);
    return members.find((m) => m.id === memberId) ?? null;
  }

  async removeMember(orgId: number, memberId: number) {
    const [result] = await this.pool.query<ResultSetHeader>(
      `UPDATE organization_members SET status = 'removed' WHERE organization_id = ? AND id = ?`,
      [orgId, memberId],
    );
    return result.affectedRows > 0;
  }

  async getRoles() {
    const [rows] = await this.pool.query<Row[]>(
      `SELECT * FROM organization_roles WHERE organization_id IS NULL ORDER BY id`,
    );
    return rows.map((r) => ({
      id: r['id'] as number, code: r['code'] as string, name: r['name'] as string,
      description: r['description'] as string | null, isSystem: Boolean(r['is_system']),
    }));
  }

  async getBranding(orgId: number) {
    const [rows] = await this.pool.query<Row[]>(
      `SELECT * FROM organization_branding WHERE organization_id = ?`, [orgId],
    );
    if (!rows[0]) return null;
    const r = rows[0];
    return {
      id: r['id'] as number, companyName: r['company_name'] as string,
      logoUrl: r['logo_url'] as string | null, logoInitials: r['logo_initials'] as string | null,
      primaryColor: r['primary_color'] as string, secondaryColor: r['secondary_color'] as string,
      accentColor: r['accent_color'] as string, faviconUrl: r['favicon_url'] as string | null,
    };
  }

  async updateBranding(orgId: number, dto: BrandingBodyDto, actorId?: number) {
    await this.pool.query(
      `INSERT INTO organization_branding (uuid, organization_id, company_name, logo_url, logo_initials, primary_color, secondary_color, accent_color, favicon_url, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE company_name = VALUES(company_name), logo_url = VALUES(logo_url), logo_initials = VALUES(logo_initials),
         primary_color = VALUES(primary_color), secondary_color = VALUES(secondary_color), accent_color = VALUES(accent_color),
         favicon_url = VALUES(favicon_url), updated_by = VALUES(updated_by)`,
      [randomUUID(), orgId, dto.companyName, dto.logoUrl ?? null, dto.logoInitials ?? null,
        dto.primaryColor, dto.secondaryColor, dto.accentColor, dto.faviconUrl ?? null, actorId ?? null],
    );
    await this.pool.query(
      `UPDATE organizations SET logo_url = ?, logo_initials = ?, primary_color = ?, updated_by = ? WHERE id = ?`,
      [dto.logoUrl ?? null, dto.logoInitials ?? null, dto.primaryColor, actorId ?? null, orgId],
    );
    return this.getBranding(orgId);
  }

  async getPreferences(orgId: number) {
    const [rows] = await this.pool.query<Row[]>(
      `SELECT pref_key, pref_value FROM organization_preferences WHERE organization_id = ?`, [orgId],
    );
    const prefs: Record<string, unknown> = {};
    for (const r of rows) {
      prefs[r['pref_key'] as string] = parseJson(r['pref_value'], r['pref_value']);
    }
    return prefs;
  }

  async updatePreferences(orgId: number, preferences: Record<string, unknown>, actorId?: number) {
    for (const [key, value] of Object.entries(preferences)) {
      await this.pool.query(
        `INSERT INTO organization_preferences (uuid, organization_id, pref_key, pref_value, updated_by)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE pref_value = VALUES(pref_value), updated_by = VALUES(updated_by)`,
        [randomUUID(), orgId, key, JSON.stringify(value), actorId ?? null],
      );
    }
    return this.getPreferences(orgId);
  }

  async getApiKeys(orgId: number) {
    const [rows] = await this.pool.query<Row[]>(
      `SELECT * FROM organization_api_keys WHERE organization_id = ? ORDER BY created_at DESC`, [orgId],
    );
    return rows.map((r) => ({
      id: r['id'] as number, uuid: r['uuid'] as string, name: r['name'] as string,
      keyPrefix: r['key_prefix'] as string, maskedKey: `${r['key_prefix'] as string}${'•'.repeat(24)}`,
      environment: r['environment'] as string, status: r['status'] as string,
      lastUsedAt: r['last_used_at'] as string | null, expiresAt: r['expires_at'] as string | null,
      createdAt: r['created_at'] as string,
    }));
  }

  async createApiKey(orgId: number, dto: CreateApiKeyBodyDto, actorId?: number) {
    const prefix = dto.environment === 'live' ? 'pk_live_' : 'pk_test_';
    const secret = prefix + randomBytes(24).toString('hex');
    const hash = createHash('sha256').update(secret).digest('hex');
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO organization_api_keys (uuid, organization_id, name, key_prefix, key_hash, environment, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?)`,
      [randomUUID(), orgId, dto.name, prefix, hash, dto.environment ?? 'test', actorId ?? null],
    );
    const keys = await this.getApiKeys(orgId);
    const created = keys.find((k) => k.id === result.insertId)!;
    return { ...created, secret };
  }

  async revokeApiKey(orgId: number, keyId: number) {
    const [result] = await this.pool.query<ResultSetHeader>(
      `UPDATE organization_api_keys SET status = 'revoked', revoked_at = NOW(6) WHERE organization_id = ? AND id = ?`,
      [orgId, keyId],
    );
    return result.affectedRows > 0;
  }

  async getBilling(orgId: number) {
    const [rows] = await this.pool.query<Row[]>(
      `SELECT * FROM organization_billing WHERE organization_id = ?`, [orgId],
    );
    if (!rows[0]) return null;
    const r = rows[0];
    return {
      id: r['id'] as number, planCode: r['plan_code'] as string, planName: r['plan_name'] as string,
      billingEmail: r['billing_email'] as string | null, billingCycle: r['billing_cycle'] as string,
      status: r['status'] as string, currency: r['currency'] as string,
      amount: Number(r['amount']), nextBillingAt: r['next_billing_at'] as string | null,
      taxExempt: Boolean(r['tax_exempt']),
      paymentMethodLast4: r['payment_method_last4'] as string | null,
      paymentMethodBrand: r['payment_method_brand'] as string | null,
    };
  }

  async updateBilling(orgId: number, dto: BillingBodyDto, actorId?: number) {
    const existing = await this.getBilling(orgId);
    if (!existing) {
      await this.pool.query(
        `INSERT INTO organization_billing (uuid, organization_id, plan_code, plan_name, billing_email, billing_cycle, status, currency, amount, next_billing_at, tax_exempt, payment_method_last4, payment_method_brand, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          randomUUID(), orgId, dto.planCode ?? 'starter', dto.planName ?? 'Starter',
          dto.billingEmail ?? null, dto.billingCycle ?? 'monthly', dto.status ?? 'trialing',
          dto.currency ?? 'USD', dto.amount ?? 0, dto.nextBillingAt ?? null,
          dto.taxExempt ? 1 : 0, dto.paymentMethodLast4 ?? null, dto.paymentMethodBrand ?? null, actorId ?? null,
        ],
      );
    } else {
      const fields: string[] = [];
      const params: unknown[] = [];
      const map: Record<string, unknown> = {
        plan_code: dto.planCode, plan_name: dto.planName, billing_email: dto.billingEmail,
        billing_cycle: dto.billingCycle, status: dto.status, currency: dto.currency,
        amount: dto.amount, next_billing_at: dto.nextBillingAt,
        tax_exempt: dto.taxExempt === undefined ? undefined : (dto.taxExempt ? 1 : 0),
        payment_method_last4: dto.paymentMethodLast4, payment_method_brand: dto.paymentMethodBrand,
      };
      for (const [col, val] of Object.entries(map)) {
        if (val !== undefined) { fields.push(`${col} = ?`); params.push(val); }
      }
      if (fields.length) {
        fields.push('updated_by = ?');
        params.push(actorId ?? null, orgId);
        await this.pool.query(`UPDATE organization_billing SET ${fields.join(', ')} WHERE organization_id = ?`, params);
      }
    }
    return this.getBilling(orgId);
  }

  async getStats() {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT
         COUNT(*) AS total,
         SUM(status = 'active') AS active,
         SUM(status = 'pending') AS pending,
         SUM(status = 'archived') AS archived
       FROM organizations`,
    );
    return {
      total: Number(rows[0]?.total ?? 0),
      active: Number(rows[0]?.active ?? 0),
      pending: Number(rows[0]?.pending ?? 0),
      archived: Number(rows[0]?.archived ?? 0),
    };
  }
}
