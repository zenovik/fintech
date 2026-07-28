import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { randomUUID } from 'node:crypto';
import { getPool } from '../../../database';
import { getOrganizationId, appendMerchantOrgFilter } from '../../../shared/context/org-context';
import { getMerchantId } from '../../../shared/context/merchant-context';
import {
  AssignOutletsBodyDto, AssignRoleBodyDto, CreateMerchantUserBodyDto,
  InviteMerchantUserBodyDto, MerchantUserListQueryDto, UpdateMerchantUserBodyDto,
} from '../dto';

export interface MerchantUserRow extends RowDataPacket {
  id: number;
  uuid: string;
  user_id: number;
  organization_id: number;
  merchant_id: number;
  merchant_role_id: number;
  default_outlet_id: number | null;
  access_scope: 'single' | 'multiple' | 'all';
  status: string;
  invited_at: string | null;
  activated_at: string | null;
  email: string;
  first_name: string;
  last_name: string;
  merchant_name?: string;
  organization_name?: string;
  role_code?: string;
  role_name?: string;
  created_at: string;
}

export interface MerchantMembership {
  merchantUserId: number;
  roleCode: string;
  accessScope: 'single' | 'multiple' | 'all';
  outletIds: number[];
  defaultOutletId: number | null;
}

export class MerchantUserRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async findMembership(userId: number, merchantId: number, orgId: number): Promise<MerchantMembership | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT mu.id, mr.code AS role_code, mu.access_scope, mu.default_outlet_id
       FROM merchant_users mu
       JOIN merchant_roles mr ON mr.id = mu.merchant_role_id
       WHERE mu.user_id = ? AND mu.merchant_id = ? AND mu.organization_id = ?
         AND mu.status = 'active' AND mu.deleted_at IS NULL`,
      [userId, merchantId, orgId],
    );
    const row = rows[0];
    if (!row) return null;

    const [outletRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT outlet_id FROM merchant_user_outlets WHERE merchant_user_id = ?`,
      [row.id],
    );

    return {
      merchantUserId: Number(row.id),
      roleCode: row.role_code as string,
      accessScope: row.access_scope as MerchantMembership['accessScope'],
      outletIds: outletRows.map((o) => Number(o.outlet_id)),
      defaultOutletId: row.default_outlet_id ? Number(row.default_outlet_id) : null,
    };
  }

  async isPlatformMerchantAccess(userId: number, merchantId: number, orgId: number): Promise<boolean> {
    const [roleRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT r.code FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?`,
      [userId],
    );
    if (roleRows.some((r) => ['super_admin', 'admin', 'merchant_manager', 'operations_manager'].includes(r.code as string))) {
      const [m] = await this.pool.query<RowDataPacket[]>(
        'SELECT id FROM merchants WHERE id = ? AND organization_id = ? AND deleted_at IS NULL',
        [merchantId, orgId],
      );
      return m.length > 0;
    }
    const [orgMember] = await this.pool.query<RowDataPacket[]>(
      `SELECT r.code AS role_code FROM organization_members om
       JOIN organization_roles r ON r.id = om.org_role_id
       WHERE om.user_id = ? AND om.organization_id = ? AND om.status = 'active'`,
      [userId, orgId],
    );
    if (orgMember.some((m) => ['owner', 'admin'].includes(m.role_code as string))) {
      const [m] = await this.pool.query<RowDataPacket[]>(
        'SELECT id FROM merchants WHERE id = ? AND organization_id = ? AND deleted_at IS NULL',
        [merchantId, orgId],
      );
      return m.length > 0;
    }
    return false;
  }

  async listOutletIdsForMerchant(merchantId: number): Promise<number[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT id FROM merchant_outlets WHERE merchant_id = ? AND deleted_at IS NULL',
      [merchantId],
    );
    return rows.map((r) => Number(r.id));
  }

  async findAll(query: MerchantUserListQueryDto): Promise<{ items: MerchantUserRow[]; total: number }> {
    const conditions = ['mu.deleted_at IS NULL'];
    const params: unknown[] = [];
    appendMerchantOrgFilter(conditions, params, 'm');

    const orgId = getOrganizationId();
    if (orgId) {
      conditions.push('mu.organization_id = ?');
      params.push(orgId);
    }
    if (query.organizationId) {
      conditions.push('mu.organization_id = ?');
      params.push(query.organizationId);
    }
    if (query.merchantId) {
      conditions.push('mu.merchant_id = ?');
      params.push(query.merchantId);
    } else {
      const merchantId = getMerchantId();
      if (merchantId) {
        conditions.push('mu.merchant_id = ?');
        params.push(merchantId);
      }
    }
    if (query.status) {
      conditions.push('mu.status = ?');
      params.push(query.status);
    }
    if (query.search) {
      conditions.push('(u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)');
      const s = `%${query.search}%`;
      params.push(s, s, s);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (query.page - 1) * query.pageSize;

    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM merchant_users mu
       JOIN users u ON u.id = mu.user_id
       JOIN merchants m ON m.id = mu.merchant_id ${where}`,
      params,
    );
    const [rows] = await this.pool.query<MerchantUserRow[]>(
      `SELECT mu.*, u.email, u.first_name, u.last_name, m.display_name AS merchant_name,
              org.display_name AS organization_name, mr.code AS role_code, mr.name AS role_name
       FROM merchant_users mu
       JOIN users u ON u.id = mu.user_id
       JOIN merchants m ON m.id = mu.merchant_id
       JOIN organizations org ON org.id = mu.organization_id
       JOIN merchant_roles mr ON mr.id = mu.merchant_role_id
       ${where}
       ORDER BY mu.created_at DESC LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async findById(id: number): Promise<MerchantUserRow | null> {
    const conditions = ['mu.id = ?', 'mu.deleted_at IS NULL'];
    const params: unknown[] = [id];
    appendMerchantOrgFilter(conditions, params, 'm');
    const orgId = getOrganizationId();
    if (orgId) {
      conditions.push('mu.organization_id = ?');
      params.push(orgId);
    }
    const merchantId = getMerchantId();
    if (merchantId) {
      conditions.push('mu.merchant_id = ?');
      params.push(merchantId);
    }

    const [rows] = await this.pool.query<MerchantUserRow[]>(
      `SELECT mu.*, u.email, u.first_name, u.last_name, m.display_name AS merchant_name,
              org.display_name AS organization_name, mr.code AS role_code, mr.name AS role_name
       FROM merchant_users mu
       JOIN users u ON u.id = mu.user_id
       JOIN merchants m ON m.id = mu.merchant_id
       JOIN organizations org ON org.id = mu.organization_id
       JOIN merchant_roles mr ON mr.id = mu.merchant_role_id
       WHERE ${conditions.join(' AND ')}`,
      params,
    );
    return rows[0] ?? null;
  }

  async getOutletIds(merchantUserId: number): Promise<number[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT outlet_id FROM merchant_user_outlets WHERE merchant_user_id = ?',
      [merchantUserId],
    );
    return rows.map((r) => Number(r.outlet_id));
  }

  async findRoles(): Promise<RowDataPacket[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT id, code, name, description FROM merchant_roles WHERE is_active = 1 ORDER BY id',
    );
    return rows;
  }

  async findRoleIdByCode(code: string): Promise<number | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT id FROM merchant_roles WHERE code = ? AND is_active = 1',
      [code],
    );
    return rows[0] ? Number(rows[0].id) : null;
  }

  async createUserRecord(
    email: string, firstName: string, lastName: string, passwordHash: string, actorId?: number,
  ): Promise<number> {
    const uuid = randomUUID();
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO users (uuid, email, password_hash, first_name, last_name, email_verified_at, status)
       VALUES (?, ?, ?, ?, ?, NOW(), 'active')`,
      [uuid, email.toLowerCase(), passwordHash, firstName, lastName],
    );
    return result.insertId;
  }

  async createMembership(
    dto: CreateMerchantUserBodyDto, userId: number, actorId?: number,
  ): Promise<number> {
    const orgId = getOrganizationId() ?? dto.organizationId;
    const uuid = randomUUID();
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO merchant_users (
        uuid, user_id, organization_id, merchant_id, merchant_role_id, default_outlet_id,
        access_scope, status, activated_at, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', NOW(), ?, ?)`,
      [
        uuid, userId, orgId, dto.merchantId, dto.merchantRoleId, dto.defaultOutletId ?? null,
        dto.accessScope ?? 'all', actorId ?? null, actorId ?? null,
      ],
    );
    const merchantUserId = result.insertId;
    if (dto.outletIds?.length) {
      await this.replaceOutlets(merchantUserId, dto.outletIds, actorId);
    }
    return merchantUserId;
  }

  async inviteMembership(dto: InviteMerchantUserBodyDto, userId: number, actorId?: number): Promise<number> {
    const orgId = getOrganizationId() ?? dto.organizationId;
    const uuid = randomUUID();
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO merchant_users (
        uuid, user_id, organization_id, merchant_id, merchant_role_id, default_outlet_id,
        access_scope, status, invited_at, invited_by, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'invited', NOW(), ?, ?, ?)`,
      [
        uuid, userId, orgId, dto.merchantId, dto.merchantRoleId, dto.defaultOutletId ?? null,
        dto.accessScope ?? 'all', actorId ?? null, actorId ?? null, actorId ?? null,
      ],
    );
    return result.insertId;
  }

  async update(id: number, dto: UpdateMerchantUserBodyDto, actorId?: number): Promise<void> {
    const fields: string[] = [];
    const params: unknown[] = [];
    if (dto.merchantRoleId != null) { fields.push('merchant_role_id = ?'); params.push(dto.merchantRoleId); }
    if (dto.defaultOutletId !== undefined) { fields.push('default_outlet_id = ?'); params.push(dto.defaultOutletId); }
    if (dto.accessScope) { fields.push('access_scope = ?'); params.push(dto.accessScope); }
    if (dto.status) { fields.push('status = ?'); params.push(dto.status); }
    if (!fields.length) return;
    fields.push('updated_by = ?');
    params.push(actorId ?? null, id);
    await this.pool.query(`UPDATE merchant_users SET ${fields.join(', ')} WHERE id = ?`, params);
  }

  async updateStatus(id: number, status: string, actorId?: number): Promise<void> {
    const extra = status === 'active' ? ', activated_at = COALESCE(activated_at, NOW())' : '';
    await this.pool.query(
      `UPDATE merchant_users SET status = ?, updated_by = ?${extra} WHERE id = ?`,
      [status, actorId ?? null, id],
    );
  }

  async assignRole(id: number, merchantRoleId: number, actorId?: number): Promise<void> {
    await this.pool.query(
      'UPDATE merchant_users SET merchant_role_id = ?, updated_by = ? WHERE id = ?',
      [merchantRoleId, actorId ?? null, id],
    );
  }

  async replaceOutlets(merchantUserId: number, outletIds: number[], actorId?: number): Promise<void> {
    await this.pool.query('DELETE FROM merchant_user_outlets WHERE merchant_user_id = ?', [merchantUserId]);
    for (const outletId of outletIds) {
      await this.pool.query(
        'INSERT INTO merchant_user_outlets (merchant_user_id, outlet_id, assigned_by) VALUES (?, ?, ?)',
        [merchantUserId, outletId, actorId ?? null],
      );
    }
  }

  async resetPassword(userId: number, passwordHash: string): Promise<void> {
    await this.pool.query(
      'UPDATE users SET password_hash = ?, password_changed_at = NOW() WHERE id = ?',
      [passwordHash, userId],
    );
  }

  async findMembershipsForUser(userId: number, orgId?: number): Promise<RowDataPacket[]> {
    const conditions = ['mu.user_id = ?', 'mu.deleted_at IS NULL', "mu.status IN ('active','invited')"];
    const params: unknown[] = [userId];
    if (orgId) {
      conditions.push('mu.organization_id = ?');
      params.push(orgId);
    }
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT mu.id, mu.merchant_id, mu.organization_id, mu.access_scope, mu.default_outlet_id,
              m.display_name AS merchant_name, mr.code AS role_code, mr.name AS role_name
       FROM merchant_users mu
       JOIN merchants m ON m.id = mu.merchant_id
       JOIN merchant_roles mr ON mr.id = mu.merchant_role_id
       WHERE ${conditions.join(' AND ')}`,
      params,
    );
    return rows;
  }

  async emailExists(email: string): Promise<boolean> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
      [email.toLowerCase()],
    );
    return rows.length > 0;
  }

  async findUserIdByEmail(email: string): Promise<number | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
      [email.toLowerCase()],
    );
    return rows[0] ? Number(rows[0].id) : null;
  }
}
