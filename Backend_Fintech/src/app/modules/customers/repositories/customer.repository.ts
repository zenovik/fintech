import { randomUUID } from 'crypto';
import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { getOrganizationId } from '../../../shared/context/org-context';
import {
  CreateCustomerWithOrgDto,
  CustomerListQueryDto,
  CustomerSearchQueryDto,
  CustomerTransactionsQueryDto,
  UpdateCustomerBodyDto,
  UpdateCustomerStatusBodyDto,
} from '../dto';
import {
  CustomerAddressRow,
  CustomerMerchantRow,
  CustomerRow,
  CustomerStatisticsRow,
  CustomerTransactionRow,
} from '../types/customer.types';

export class CustomerRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async findAll(query: CustomerListQueryDto): Promise<{ items: CustomerRow[]; total: number }> {
    const {
      page, pageSize, search, status, kycStatus, riskLevel, customerType,
      organizationId, merchantId, regionId, dateFrom, dateTo, sortBy, sortOrder,
    } = query;
    const conditions: string[] = ['c.deleted_at IS NULL'];
    const params: unknown[] = [];

    if (search) {
      conditions.push('(c.customer_code LIKE ? OR c.display_name LIKE ? OR c.email LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }
    if (status) { conditions.push('c.status = ?'); params.push(status); }
    if (kycStatus) { conditions.push('c.kyc_status = ?'); params.push(kycStatus); }
    if (riskLevel) { conditions.push('c.risk_level = ?'); params.push(riskLevel); }
    if (customerType) { conditions.push('c.customer_type = ?'); params.push(customerType); }
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('c.organization_id = ?'); params.push(orgId); }
    if (merchantId) {
      conditions.push('(c.primary_merchant_id = ? OR EXISTS (SELECT 1 FROM customer_merchants cm WHERE cm.customer_id = c.id AND cm.merchant_id = ?))');
      params.push(merchantId, merchantId);
    }
    if (regionId) { conditions.push('c.region_id = ?'); params.push(regionId); }
    if (dateFrom) { conditions.push('DATE(c.created_at) >= ?'); params.push(dateFrom); }
    if (dateTo) { conditions.push('DATE(c.created_at) <= ?'); params.push(dateTo); }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const allowedSort = ['created_at', 'display_name', 'total_spent', 'last_transaction_at'];
    const sortCol = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const offset = (page - 1) * pageSize;

    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM customers c ${where}`,
      params,
    );
    const total = Number(countRows[0]?.total ?? 0);

    const [rows] = await this.pool.query<CustomerRow[]>(
      `SELECT c.*, o.display_name AS organization_name, o.code AS organization_code,
              m.display_name AS merchant_name, m.merchant_code AS merchant_code,
              r.code AS region_code, r.name AS region_name
       FROM customers c
       LEFT JOIN organizations o ON o.id = c.organization_id
       LEFT JOIN merchants m ON m.id = c.primary_merchant_id
       LEFT JOIN regions r ON r.id = c.region_id
       ${where}
       ORDER BY c.${sortCol} ${order}
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset],
    );
    return { items: rows, total };
  }

  async search(query: CustomerSearchQueryDto): Promise<CustomerRow[]> {
    const term = `%${query.q}%`;
    const conditions = ['c.deleted_at IS NULL', '(c.customer_code LIKE ? OR c.display_name LIKE ? OR c.email LIKE ?)'];
    const params: unknown[] = [term, term, term];
    const orgId = getOrganizationId();
    if (orgId) {
      conditions.push('c.organization_id = ?');
      params.push(orgId);
    }
    const [rows] = await this.pool.query<CustomerRow[]>(
      `SELECT c.*, o.display_name AS organization_name
       FROM customers c
       LEFT JOIN organizations o ON o.id = c.organization_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY c.display_name ASC
       LIMIT ?`,
      [...params, query.limit],
    );
    return rows;
  }

  async getStatistics(): Promise<CustomerStatisticsRow> {
    const params: unknown[] = [];
    let where = 'WHERE deleted_at IS NULL';
    const orgId = getOrganizationId();
    if (orgId) {
      where += ' AND organization_id = ?';
      params.push(orgId);
    }
    const [rows] = await this.pool.query<CustomerStatisticsRow[]>(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_count,
         SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) AS inactive_count,
         SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) AS blocked_count,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
         SUM(CASE WHEN kyc_status = 'verified' THEN 1 ELSE 0 END) AS verified_kyc_count,
         SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) AS high_risk_count
       FROM customers ${where}`,
      params,
    );
    return rows[0]!;
  }

  async findById(id: number): Promise<CustomerRow | null> {
    const orgId = getOrganizationId();
    const orgClause = orgId ? ' AND c.organization_id = ?' : '';
    const params: unknown[] = orgId ? [id, orgId] : [id];
    const [rows] = await this.pool.query<CustomerRow[]>(
      `SELECT c.*, o.display_name AS organization_name, o.code AS organization_code,
              m.display_name AS merchant_name, m.merchant_code AS merchant_code,
              r.code AS region_code, r.name AS region_name
       FROM customers c
       LEFT JOIN organizations o ON o.id = c.organization_id
       LEFT JOIN merchants m ON m.id = c.primary_merchant_id
       LEFT JOIN regions r ON r.id = c.region_id
       WHERE c.id = ? AND c.deleted_at IS NULL${orgClause}`,
      params,
    );
    return rows[0] ?? null;
  }

  async findAddresses(customerId: number): Promise<CustomerAddressRow[]> {
    const [rows] = await this.pool.query<CustomerAddressRow[]>(
      `SELECT * FROM customer_addresses WHERE customer_id = ? AND deleted_at IS NULL ORDER BY is_primary DESC`,
      [customerId],
    );
    return rows;
  }

  async findMerchants(customerId: number): Promise<CustomerMerchantRow[]> {
    const [rows] = await this.pool.query<CustomerMerchantRow[]>(
      `SELECT cm.*, m.merchant_code, m.display_name, m.status
       FROM customer_merchants cm
       JOIN merchants m ON m.id = cm.merchant_id
       WHERE cm.customer_id = ?
       ORDER BY cm.last_transaction_at DESC`,
      [customerId],
    );
    return rows;
  }

  async findTransactions(
    customerId: number,
    query: CustomerTransactionsQueryDto,
  ): Promise<{ items: CustomerTransactionRow[]; total: number }> {
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM transactions WHERE customer_id = ? AND deleted_at IS NULL`,
      [customerId],
    );
    const total = Number(countRows[0]?.total ?? 0);
    const [rows] = await this.pool.query<CustomerTransactionRow[]>(
      `SELECT t.id, t.uuid, t.transaction_ref, t.amount, t.currency, t.payment_method_detail,
              ts.code AS status_code, ts.label AS status_label, t.merchant_id,
              m.display_name AS merchant_name, t.processed_at, t.settled_at
       FROM transactions t
       JOIN transaction_statuses ts ON ts.id = t.status_id
       LEFT JOIN merchants m ON m.id = t.merchant_id
       WHERE t.customer_id = ? AND t.deleted_at IS NULL
       ORDER BY t.processed_at DESC
       LIMIT ? OFFSET ?`,
      [customerId, query.pageSize, offset],
    );
    return { items: rows, total };
  }

  private generateCustomerCode(firstName: string, lastName?: string | null): string {
    const base = `${firstName}-${lastName ?? 'cust'}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const suffix = String(Math.floor(100 + Math.random() * 900));
    return `cust-${base.slice(0, 20)}-${suffix}`;
  }

  async create(dto: CreateCustomerWithOrgDto, userId?: number): Promise<number> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const uuid = randomUUID();
      const customerCode = this.generateCustomerCode(dto.firstName, dto.lastName);
      const displayName = dto.displayName ?? `${dto.firstName}${dto.lastName ? ` ${dto.lastName}` : ''}`;

      const [result] = await conn.query<ResultSetHeader>(
        `INSERT INTO customers (
          uuid, customer_code, organization_id, primary_merchant_id, customer_type,
          first_name, last_name, display_name, email, phone, company_name,
          status, kyc_status, risk_level, region_id, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuid, customerCode, dto.organizationId, dto.primaryMerchantId ?? null, dto.customerType ?? 'individual',
          dto.firstName, dto.lastName ?? null, displayName, dto.email || null, dto.phone ?? null, dto.companyName ?? null,
          dto.status ?? 'active', dto.kycStatus ?? 'pending', dto.riskLevel ?? 'low', dto.regionId ?? null,
          dto.notes ?? null, userId ?? null,
        ],
      );
      const customerId = result.insertId;

      if (dto.primaryMerchantId) {
        await conn.query(
          `INSERT INTO customer_merchants (customer_id, merchant_id) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE merchant_id = merchant_id`,
          [customerId, dto.primaryMerchantId],
        );
      }

      for (const addr of dto.addresses ?? []) {
        await conn.query(
          `INSERT INTO customer_addresses (uuid, customer_id, address_type, line1, line2, city, state_province, postal_code, country_code, is_primary)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [randomUUID(), customerId, addr.addressType, addr.line1, addr.line2 ?? null, addr.city,
            addr.stateProvince ?? null, addr.postalCode ?? null, addr.countryCode ?? 'US', addr.isPrimary ? 1 : 0],
        );
      }

      await conn.commit();
      return customerId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async update(id: number, dto: UpdateCustomerBodyDto, userId?: number): Promise<void> {
    const fields: string[] = [];
    const params: unknown[] = [];
    const map: Record<string, unknown> = {
      primary_merchant_id: dto.primaryMerchantId,
      customer_type: dto.customerType,
      first_name: dto.firstName,
      last_name: dto.lastName,
      display_name: dto.displayName,
      email: dto.email === '' ? null : dto.email,
      phone: dto.phone,
      company_name: dto.companyName,
      kyc_status: dto.kycStatus,
      risk_level: dto.riskLevel,
      status: dto.status,
      region_id: dto.regionId,
      notes: dto.notes,
    };
    for (const [col, val] of Object.entries(map)) {
      if (val !== undefined) {
        fields.push(`${col} = ?`);
        params.push(val);
      }
    }
    if (!fields.length) return;
    fields.push('updated_by = ?');
    params.push(userId ?? null, id);
    await this.pool.query(`UPDATE customers SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`, params);
  }

  async updateStatus(id: number, dto: UpdateCustomerStatusBodyDto, userId?: number): Promise<void> {
    await this.pool.query(
      `UPDATE customers SET status = ?, notes = COALESCE(?, notes), updated_by = ? WHERE id = ? AND deleted_at IS NULL`,
      [dto.status, dto.reason ?? null, userId ?? null, id],
    );
  }

  async softDelete(id: number, userId?: number): Promise<void> {
    await this.pool.query(
      `UPDATE customers SET deleted_at = NOW(6), updated_by = ? WHERE id = ? AND deleted_at IS NULL`,
      [userId ?? null, id],
    );
  }

  async getPreferences(customerId: number): Promise<RowDataPacket | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT * FROM customer_preferences WHERE customer_id = ? LIMIT 1', [customerId],
    );
    return rows[0] ?? null;
  }

  async upsertPreferences(customerId: number, orgId: number, data: Record<string, unknown>): Promise<void> {
    const existing = await this.getPreferences(customerId);
    if (existing) {
      await this.pool.query(
        `UPDATE customer_preferences SET locale = ?, currency = ?, default_payment_method = ?,
          communication_channel = ?, marketing_opt_in = ?, dark_mode = ?, notes = ?, preferences_json = ?
         WHERE customer_id = ?`,
        [data.locale ?? existing.locale, data.currency ?? existing.currency, data.defaultPaymentMethod ?? existing.default_payment_method,
          data.communicationChannel ?? existing.communication_channel, data.marketingOptIn ? 1 : 0,
          data.darkMode ? 1 : 0, data.notes ?? existing.notes,
          data.preferencesJson ? JSON.stringify(data.preferencesJson) : existing.preferences_json, customerId],
      );
    } else {
      await this.pool.query(
        `INSERT INTO customer_preferences (uuid, customer_id, organization_id, locale, currency, default_payment_method, communication_channel, marketing_opt_in, dark_mode, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [randomUUID(), customerId, orgId, data.locale ?? 'en-US', data.currency ?? 'USD',
          data.defaultPaymentMethod ?? null, data.communicationChannel ?? 'email', data.marketingOptIn ? 1 : 0,
          data.darkMode ? 1 : 0, data.notes ?? null],
      );
    }
  }

  async listPaymentMethods(customerId: number): Promise<RowDataPacket[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT * FROM customer_payment_methods WHERE customer_id = ? AND is_active = 1 ORDER BY is_default DESC`, [customerId],
    );
    return rows;
  }

  async getTimeline(customerId: number, limit = 50): Promise<RowDataPacket[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT 'transaction' AS type, t.transaction_ref AS ref, t.amount, t.created_at
       FROM transactions t WHERE t.customer_id = ? ORDER BY t.created_at DESC LIMIT ?`, [customerId, limit],
    );
    return rows;
  }
}
