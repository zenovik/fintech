import { randomUUID } from 'crypto';
import { merchantCodeGenerator } from '../../../shared/helpers/merchant-code.generator';
import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { appendMerchantOrgFilter, getOrganizationId } from '../../../shared/context/org-context';
import {
  CreateDocumentBodyDto,
  CreateMerchantBodyDto,
  MerchantListQueryDto,
  MerchantSearchQueryDto,
  MerchantTransactionsQueryDto,
  UpdateMerchantBodyDto,
  UpdateMerchantStatusBodyDto,
} from '../dto';
import {
  MerchantAddressRow,
  MerchantApiCredentialRow,
  MerchantContactRow,
  MerchantDocumentRow,
  MerchantRow,
  MerchantSettlementRow,
  MerchantStatisticsRow,
  MerchantTagRow,
  MerchantTransactionRow,
} from '../types/merchant.types';

export class MerchantRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async findAll(query: MerchantListQueryDto): Promise<{ items: MerchantRow[]; total: number }> {
    const { page, pageSize, search, status, kycStatus, riskLevel, businessType, regionId, dateFrom, dateTo, sortBy, sortOrder } = query;
    const conditions: string[] = ['m.deleted_at IS NULL'];
    const params: unknown[] = [];

    if (search) {
      conditions.push('(m.merchant_code LIKE ? OR m.display_name LIKE ? OR m.legal_name LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    if (status) {
      conditions.push('m.status = ?');
      params.push(status);
    }
    if (kycStatus) {
      conditions.push('m.kyc_status = ?');
      params.push(kycStatus);
    }
    if (riskLevel) {
      conditions.push('m.risk_level = ?');
      params.push(riskLevel);
    }
    if (businessType) {
      conditions.push('m.business_type = ?');
      params.push(businessType);
    }
    if (regionId) {
      conditions.push('m.region_id = ?');
      params.push(regionId);
    }
    if (dateFrom) {
      conditions.push('DATE(m.created_at) >= ?');
      params.push(dateFrom);
    }
    if (dateTo) {
      conditions.push('DATE(m.created_at) <= ?');
      params.push(dateTo);
    }

    appendMerchantOrgFilter(conditions, params);

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const allowedSort = ['created_at', 'display_name', 'merchant_code', 'daily_volume'];
    const sortCol = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const offset = (page - 1) * pageSize;

    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM merchants m ${where}`,
      params,
    );
    const total = Number(countRows[0]?.total ?? 0);

    const [rows] = await this.pool.query<MerchantRow[]>(
      `SELECT m.*, r.code AS region_code, r.name AS region_name
       FROM merchants m
       LEFT JOIN regions r ON r.id = m.region_id
       ${where}
       ORDER BY m.${sortCol} ${order}
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset],
    );

    return { items: rows, total };
  }

  async search(query: MerchantSearchQueryDto): Promise<MerchantRow[]> {
    const term = `%${query.q}%`;
    const conditions = [
      'm.deleted_at IS NULL',
      '(m.merchant_code LIKE ? OR m.display_name LIKE ? OR m.legal_name LIKE ?)',
    ];
    const params: unknown[] = [term, term, term];
    appendMerchantOrgFilter(conditions, params);
    const [rows] = await this.pool.query<MerchantRow[]>(
      `SELECT m.*, r.code AS region_code, r.name AS region_name
       FROM merchants m
       LEFT JOIN regions r ON r.id = m.region_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY m.display_name ASC
       LIMIT ?`,
      [...params, query.limit],
    );
    return rows;
  }

  async getStatistics(): Promise<MerchantStatisticsRow> {
    const [rows] = await this.pool.query<MerchantStatisticsRow[]>(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_count,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
         SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) AS suspended_count,
         SUM(CASE WHEN kyc_status = 'verified' THEN 1 ELSE 0 END) AS verified_kyc_count,
         SUM(CASE WHEN kyc_status = 'pending' THEN 1 ELSE 0 END) AS pending_kyc_count,
         SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) AS high_risk_count
       FROM merchants
       WHERE deleted_at IS NULL`,
    );
    return rows[0]!;
  }

  async findById(id: number): Promise<MerchantRow | null> {
    const conditions = ['m.id = ?', 'm.deleted_at IS NULL'];
    const params: unknown[] = [id];
    appendMerchantOrgFilter(conditions, params);
    const [rows] = await this.pool.query<MerchantRow[]>(
      `SELECT m.*, r.code AS region_code, r.name AS region_name
       FROM merchants m
       LEFT JOIN regions r ON r.id = m.region_id
       WHERE ${conditions.join(' AND ')}`,
      params,
    );
    return rows[0] ?? null;
  }

  async findContacts(merchantId: number): Promise<MerchantContactRow[]> {
    const [rows] = await this.pool.query<MerchantContactRow[]>(
      `SELECT * FROM merchant_contacts WHERE merchant_id = ? AND deleted_at IS NULL ORDER BY is_primary DESC`,
      [merchantId],
    );
    return rows;
  }

  async findAddresses(merchantId: number): Promise<MerchantAddressRow[]> {
    const [rows] = await this.pool.query<MerchantAddressRow[]>(
      `SELECT * FROM merchant_addresses WHERE merchant_id = ? AND deleted_at IS NULL ORDER BY is_primary DESC`,
      [merchantId],
    );
    return rows;
  }

  async findDocuments(merchantId: number): Promise<MerchantDocumentRow[]> {
    const [rows] = await this.pool.query<MerchantDocumentRow[]>(
      `SELECT * FROM merchant_documents WHERE merchant_id = ? AND deleted_at IS NULL ORDER BY created_at DESC`,
      [merchantId],
    );
    return rows;
  }

  async findApiCredentials(merchantId: number): Promise<MerchantApiCredentialRow[]> {
    const [rows] = await this.pool.query<MerchantApiCredentialRow[]>(
      `SELECT id, uuid, merchant_id, key_name, api_key_prefix, environment, is_active, last_used_at, created_at
       FROM merchant_api_credentials
       WHERE merchant_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [merchantId],
    );
    return rows;
  }

  async findTags(merchantId: number): Promise<MerchantTagRow[]> {
    const [rows] = await this.pool.query<MerchantTagRow[]>(
      `SELECT t.id, t.name, t.color
       FROM merchant_tags t
       JOIN merchant_tag_assignments a ON a.tag_id = t.id
       WHERE a.merchant_id = ?`,
      [merchantId],
    );
    return rows;
  }

  async findTransactions(
    merchantId: number,
    query: MerchantTransactionsQueryDto,
  ): Promise<{ items: MerchantTransactionRow[]; total: number }> {
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM transactions WHERE merchant_id = ?`,
      [merchantId],
    );
    const total = Number(countRows[0]?.total ?? 0);

    const [rows] = await this.pool.query<MerchantTransactionRow[]>(
      `SELECT t.id, t.uuid, t.transaction_ref, t.amount, t.currency, t.payment_method_detail,
              ts.code AS status_code, ts.label AS status_label, t.processed_at, t.settled_at
       FROM transactions t
       JOIN transaction_statuses ts ON ts.id = t.status_id
       WHERE t.merchant_id = ?
       ORDER BY t.processed_at DESC
       LIMIT ? OFFSET ?`,
      [merchantId, query.pageSize, offset],
    );
    return { items: rows, total };
  }

  async findSettlements(merchantId: number): Promise<MerchantSettlementRow[]> {
    const [rows] = await this.pool.query<MerchantSettlementRow[]>(
      `SELECT id, uuid, settlement_ref, amount, currency, status, processed_at
       FROM settlements
       WHERE merchant_id = ?
       ORDER BY processed_at DESC
       LIMIT 50`,
      [merchantId],
    );
    return rows;
  }

  private async generateMerchantCode(): Promise<string> {
    return merchantCodeGenerator.generate();
  }

  async create(dto: CreateMerchantBodyDto, userId?: number): Promise<number> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const uuid = randomUUID();
      const merchantCode = await this.generateMerchantCode();
      const orgId = getOrganizationId();
      const initials = dto.displayName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      const [result] = await conn.query<ResultSetHeader>(
        `INSERT INTO merchants (
          uuid, merchant_code, legal_name, display_name, logo_initials, logo_color,
          business_type, business_category, entity_type, registration_number, website,
          monthly_tpv_estimate, kyc_status, risk_level, status, region_id, organization_id, created_by
        ) VALUES (?, ?, ?, ?, ?, 'primary', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuid,
          merchantCode,
          dto.legalName,
          dto.displayName,
          initials,
          dto.businessType ?? null,
          dto.businessCategory ?? null,
          dto.entityType ?? null,
          dto.registrationNumber ?? null,
          dto.website || null,
          dto.monthlyTpvEstimate ?? null,
          dto.kycStatus ?? 'pending',
          dto.riskLevel ?? 'low',
          dto.status ?? 'pending',
          dto.regionId,
          orgId ?? null,
          userId ?? null,
        ],
      );
      const merchantId = result.insertId;

      if (dto.contacts?.length) {
        for (const c of dto.contacts) {
          await conn.query(
            `INSERT INTO merchant_contacts (uuid, merchant_id, contact_type, first_name, last_name, email, phone, job_title, is_primary)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              randomUUID(),
              merchantId,
              c.contactType ?? 'primary',
              c.firstName,
              c.lastName,
              c.email,
              c.phone ?? null,
              c.jobTitle ?? null,
              c.isPrimary ? 1 : 0,
            ],
          );
        }
      }

      if (dto.addresses?.length) {
        for (const a of dto.addresses) {
          await conn.query(
            `INSERT INTO merchant_addresses (uuid, merchant_id, address_type, line1, line2, city, state_province, postal_code, country_code, is_primary)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              randomUUID(),
              merchantId,
              a.addressType ?? 'registered',
              a.line1,
              a.line2 ?? null,
              a.city,
              a.stateProvince ?? null,
              a.postalCode ?? null,
              a.countryCode ?? 'US',
              a.isPrimary ? 1 : 0,
            ],
          );
        }
      }

      await conn.commit();
      return merchantId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async update(id: number, dto: UpdateMerchantBodyDto, userId?: number): Promise<void> {
    const fields: string[] = [];
    const params: unknown[] = [];

    const map: Record<string, unknown> = {
      legal_name: dto.legalName,
      display_name: dto.displayName,
      logo_initials: dto.logoInitials,
      logo_color: dto.logoColor,
      business_type: dto.businessType,
      business_category: dto.businessCategory,
      entity_type: dto.entityType,
      registration_number: dto.registrationNumber,
      website: dto.website || null,
      monthly_tpv_estimate: dto.monthlyTpvEstimate,
      kyc_status: dto.kycStatus,
      risk_level: dto.riskLevel,
      status: dto.status,
      region_id: dto.regionId,
    };

    for (const [col, val] of Object.entries(map)) {
      if (val !== undefined) {
        fields.push(`${col} = ?`);
        params.push(val);
      }
    }

    if (!fields.length) return;

    fields.push('updated_by = ?');
    params.push(userId ?? null);
    params.push(id);

    await this.pool.query(
      `UPDATE merchants SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
      params,
    );
  }

  async updateStatus(id: number, dto: UpdateMerchantStatusBodyDto, userId?: number): Promise<void> {
    await this.pool.query(
      `UPDATE merchants SET status = ?, updated_by = ? WHERE id = ? AND deleted_at IS NULL`,
      [dto.status, userId ?? null, id],
    );
    if (dto.reason) {
      await this.pool.query(
        `INSERT INTO merchant_notes (uuid, merchant_id, author_user_id, note_text, is_internal)
         VALUES (?, ?, ?, ?, 1)`,
        [randomUUID(), id, userId ?? null, `Status changed to ${dto.status}: ${dto.reason}`],
      );
    }
  }

  async softDelete(id: number, userId?: number): Promise<void> {
    await this.pool.query(
      `UPDATE merchants SET deleted_at = NOW(), updated_by = ? WHERE id = ? AND deleted_at IS NULL`,
      [userId ?? null, id],
    );
  }

  async createDocument(merchantId: number, dto: CreateDocumentBodyDto, userId?: number): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO merchant_documents (uuid, merchant_id, document_type, file_name, file_url, status, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        merchantId,
        dto.documentType,
        dto.fileName,
        dto.fileUrl ?? null,
        dto.status ?? 'pending',
        userId ?? null,
      ],
    );
    return result.insertId;
  }

  async softDeleteDocument(merchantId: number, documentId: number): Promise<boolean> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `UPDATE merchant_documents SET deleted_at = NOW()
       WHERE id = ? AND merchant_id = ? AND deleted_at IS NULL`,
      [documentId, merchantId],
    );
    return result.affectedRows > 0;
  }
}
