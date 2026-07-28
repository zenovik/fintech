import { randomBytes, randomUUID } from 'crypto';
import { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { appendMerchantOrgFilter, getOrganizationId } from '../../../shared/context/org-context';
import { CreatePaymentLinkBodyDto, PaymentLinkListQueryDto, UpdatePaymentLinkBodyDto } from '../dto';
import {
  PaymentLinkRow,
  PaymentLinkStatisticsRow,
  PaymentLinkTransactionRow,
} from '../types/payment-link.types';

export class PaymentLinkRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  private baseSelect = `
    SELECT pl.*,
           o.display_name AS organization_name, o.code AS organization_code,
           m.display_name AS merchant_name, m.merchant_code,
           c.display_name AS customer_name, c.email AS customer_email,
           CONCAT(cb.first_name, ' ', cb.last_name) AS created_by_name,
           CONCAT(ub.first_name, ' ', ub.last_name) AS updated_by_name,
           (SELECT COALESCE(SUM(plt.paid_amount), 0) FROM payment_link_transactions plt WHERE plt.payment_link_id = pl.id) AS total_collected
    FROM payment_links pl
    JOIN organizations o ON o.id = pl.organization_id
    JOIN merchants m ON m.id = pl.merchant_id
    LEFT JOIN customers c ON c.id = pl.customer_id
    LEFT JOIN users cb ON cb.id = pl.created_by
    LEFT JOIN users ub ON ub.id = pl.updated_by
  `;

  async findAll(query: PaymentLinkListQueryDto): Promise<{ items: PaymentLinkRow[]; total: number }> {
    const {
      page, pageSize, search, status, merchantId, customerId, dateFrom, dateTo, sortBy, sortOrder,
    } = query;
    const conditions = ['pl.deleted_at IS NULL'];
    const params: unknown[] = [];

    const orgId = getOrganizationId();
    if (orgId) {
      conditions.push('pl.organization_id = ?');
      params.push(orgId);
    }

    if (search) {
      conditions.push('(pl.link_ref LIKE ? OR pl.title LIKE ? OR m.display_name LIKE ? OR pl.public_token LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }
    if (status) { conditions.push('pl.status = ?'); params.push(status); }
    if (merchantId) { conditions.push('pl.merchant_id = ?'); params.push(merchantId); }
    if (customerId) { conditions.push('pl.customer_id = ?'); params.push(customerId); }
    if (dateFrom) { conditions.push('DATE(pl.created_at) >= ?'); params.push(dateFrom); }
    if (dateTo) { conditions.push('DATE(pl.created_at) <= ?'); params.push(dateTo); }

    appendMerchantOrgFilter(conditions, params);

    const where = `WHERE ${conditions.join(' AND ')}`;
    const allowedSort = ['created_at', 'amount', 'status', 'expires_at', 'current_usage'];
    const sortCol = allowedSort.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
    const offset = (page - 1) * pageSize;

    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM payment_links pl
       JOIN merchants m ON m.id = pl.merchant_id
       ${where}`,
      params,
    );
    const total = Number(countRows[0]?.total ?? 0);

    const [rows] = await this.pool.query<PaymentLinkRow[]>(
      `${this.baseSelect} ${where} ORDER BY pl.${sortCol} ${order} LIMIT ? OFFSET ?`,
      [...params, pageSize, offset],
    );
    return { items: rows, total };
  }

  async getStatistics(): Promise<PaymentLinkStatisticsRow> {
    const conditions = ['pl.deleted_at IS NULL'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) {
      conditions.push('pl.organization_id = ?');
      params.push(orgId);
    }
    appendMerchantOrgFilter(conditions, params, 'm');
    const where = conditions.join(' AND ');

    const [rows] = await this.pool.query<PaymentLinkStatisticsRow[]>(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN pl.status = 'active' THEN 1 ELSE 0 END) AS active_count,
         SUM(CASE WHEN pl.status = 'disabled' THEN 1 ELSE 0 END) AS disabled_count,
         SUM(CASE WHEN pl.status = 'expired' THEN 1 ELSE 0 END) AS expired_count,
         COALESCE((SELECT SUM(plt.paid_amount) FROM payment_link_transactions plt
           JOIN payment_links plx ON plx.id = plt.payment_link_id
           JOIN merchants mx ON mx.id = plx.merchant_id
           WHERE plx.deleted_at IS NULL
           ${orgId ? 'AND plx.organization_id = ?' : ''}
           ${orgId ? 'AND mx.organization_id = ?' : ''}), 0) AS total_collected,
         COALESCE(SUM(pl.current_usage), 0) AS total_usage,
         CASE WHEN COALESCE(SUM(pl.max_usage), 0) > 0
           THEN ROUND(COALESCE(SUM(pl.current_usage), 0) / SUM(pl.max_usage) * 100, 2)
           ELSE 0 END AS conversion_rate
       FROM payment_links pl
       JOIN merchants m ON m.id = pl.merchant_id
       WHERE ${where}`,
      orgId ? [...params, orgId, orgId] : params,
    );
    return rows[0]!;
  }

  async findById(id: number): Promise<PaymentLinkRow | null> {
    const conditions = ['pl.id = ?', 'pl.deleted_at IS NULL'];
    const params: unknown[] = [id];
    const orgId = getOrganizationId();
    if (orgId) {
      conditions.push('pl.organization_id = ?');
      params.push(orgId);
    }
    const [rows] = await this.pool.query<PaymentLinkRow[]>(
      `${this.baseSelect} WHERE ${conditions.join(' AND ')}`,
      params,
    );
    return rows[0] ?? null;
  }

  async findByToken(token: string): Promise<PaymentLinkRow | null> {
    const [rows] = await this.pool.query<PaymentLinkRow[]>(
      `${this.baseSelect} WHERE pl.public_token = ? AND pl.deleted_at IS NULL LIMIT 1`,
      [token],
    );
    return rows[0] ?? null;
  }

  async findPayments(paymentLinkId: number): Promise<PaymentLinkTransactionRow[]> {
    const [rows] = await this.pool.query<PaymentLinkTransactionRow[]>(
      `SELECT plt.*, t.transaction_ref, ts.code AS transaction_status
       FROM payment_link_transactions plt
       JOIN transactions t ON t.id = plt.transaction_id
       JOIN transaction_statuses ts ON ts.id = t.status_id
       WHERE plt.payment_link_id = ?
       ORDER BY plt.created_at DESC`,
      [paymentLinkId],
    );
    return rows;
  }

  private generateRef(): string {
    return `PL-${String(Math.floor(100000 + Math.random() * 900000))}`;
  }

  generateToken(): string {
    return randomBytes(24).toString('hex');
  }

  async create(dto: CreatePaymentLinkBodyDto, organizationId: number, userId?: number): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO payment_links (
        uuid, organization_id, merchant_id, customer_id, link_ref, title, description,
        amount, currency, allow_custom_amount, expires_at, max_usage, public_token,
        redirect_url, success_url, cancel_url, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(), organizationId, dto.merchantId, dto.customerId ?? null,
        this.generateRef(), dto.title, dto.description ?? null,
        dto.amount ?? null, dto.currency ?? 'USD', dto.allowCustomAmount ? 1 : 0,
        dto.expiresAt ?? null, dto.maxUsage ?? null, this.generateToken(),
        dto.redirectUrl ?? null, dto.successUrl ?? null, dto.cancelUrl ?? null, userId ?? null,
      ],
    );
    return result.insertId;
  }

  async update(id: number, dto: UpdatePaymentLinkBodyDto, userId?: number): Promise<void> {
    const fields: string[] = [];
    const params: unknown[] = [];
    if (dto.merchantId !== undefined) { fields.push('merchant_id = ?'); params.push(dto.merchantId); }
    if (dto.customerId !== undefined) { fields.push('customer_id = ?'); params.push(dto.customerId); }
    if (dto.title !== undefined) { fields.push('title = ?'); params.push(dto.title); }
    if (dto.description !== undefined) { fields.push('description = ?'); params.push(dto.description); }
    if (dto.amount !== undefined) { fields.push('amount = ?'); params.push(dto.amount); }
    if (dto.currency !== undefined) { fields.push('currency = ?'); params.push(dto.currency); }
    if (dto.allowCustomAmount !== undefined) { fields.push('allow_custom_amount = ?'); params.push(dto.allowCustomAmount ? 1 : 0); }
    if (dto.expiresAt !== undefined) { fields.push('expires_at = ?'); params.push(dto.expiresAt || null); }
    if (dto.maxUsage !== undefined) { fields.push('max_usage = ?'); params.push(dto.maxUsage); }
    if (dto.redirectUrl !== undefined) { fields.push('redirect_url = ?'); params.push(dto.redirectUrl); }
    if (dto.successUrl !== undefined) { fields.push('success_url = ?'); params.push(dto.successUrl); }
    if (dto.cancelUrl !== undefined) { fields.push('cancel_url = ?'); params.push(dto.cancelUrl); }
    if (!fields.length) return;
    fields.push('updated_by = ?');
    params.push(userId ?? null, id);
    await this.pool.query(`UPDATE payment_links SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`, params);
  }

  async setStatus(id: number, status: string, userId?: number): Promise<void> {
    await this.pool.query(
      `UPDATE payment_links SET status = ?, updated_by = ? WHERE id = ? AND deleted_at IS NULL`,
      [status, userId ?? null, id],
    );
  }

  async regenerateToken(id: number, userId?: number): Promise<string> {
    const token = this.generateToken();
    await this.pool.query(
      `UPDATE payment_links SET public_token = ?, updated_by = ? WHERE id = ? AND deleted_at IS NULL`,
      [token, userId ?? null, id],
    );
    return token;
  }

  async recordPayment(
    conn: PoolConnection,
    paymentLinkId: number,
    transactionId: number,
    paidAmount: number,
  ): Promise<void> {
    await conn.query(
      `INSERT INTO payment_link_transactions (payment_link_id, transaction_id, paid_amount) VALUES (?, ?, ?)`,
      [paymentLinkId, transactionId, paidAmount],
    );
    await conn.query(
      `UPDATE payment_links SET current_usage = current_usage + 1, updated_at = NOW() WHERE id = ?`,
      [paymentLinkId],
    );
  }

  async expireIfMaxUsage(conn: PoolConnection, paymentLinkId: number): Promise<void> {
    await conn.query(
      `UPDATE payment_links SET status = 'expired'
       WHERE id = ? AND max_usage IS NOT NULL AND current_usage >= max_usage AND status = 'active'`,
      [paymentLinkId],
    );
  }

  async validateMerchantInOrg(merchantId: number, organizationId: number): Promise<boolean> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id FROM merchants WHERE id = ? AND organization_id = ? AND deleted_at IS NULL LIMIT 1`,
      [merchantId, organizationId],
    );
    return !!rows[0];
  }

  async validateCustomerInOrg(customerId: number, organizationId: number): Promise<boolean> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id FROM customers WHERE id = ? AND organization_id = ? AND deleted_at IS NULL LIMIT 1`,
      [customerId, organizationId],
    );
    return !!rows[0];
  }

  generateShortCode(): string {
    return randomBytes(4).toString('hex');
  }

  async clone(id: number, organizationId: number, userId?: number): Promise<number> {
    const source = await this.findById(id);
    if (!source) throw new Error('Link not found');
    const shortCode = this.generateShortCode();
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO payment_links (uuid, organization_id, merchant_id, customer_id, link_ref, title, description,
        amount, currency, allow_custom_amount, allow_partial, is_one_time, is_reusable, min_amount, max_amount,
        expires_at, max_usage, public_token, short_code, redirect_url, success_url, cancel_url, clone_of_id, created_by)
       VALUES (?, ?, ?, ?, ?, CONCAT(?, ' (Copy)'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), organizationId, source.merchant_id, source.customer_id, this.generateRef(), source.title,
        source.description, source.amount, source.currency, source.allow_custom_amount,
        (source as PaymentLinkRow & { allow_partial?: number }).allow_partial ?? 0,
        (source as PaymentLinkRow & { is_one_time?: number }).is_one_time ?? 0,
        (source as PaymentLinkRow & { is_reusable?: number }).is_reusable ?? 1,
        (source as PaymentLinkRow & { min_amount?: string }).min_amount ?? null,
        (source as PaymentLinkRow & { max_amount?: string }).max_amount ?? null,
        source.expires_at, source.max_usage, this.generateToken(), shortCode,
        source.redirect_url, source.success_url, source.cancel_url, id, userId ?? null],
    );
    return result.insertId;
  }

  async recordVisit(linkId: number, visitType: string, meta: Record<string, unknown> = {}): Promise<void> {
    await this.pool.query(
      `INSERT INTO payment_link_visits (uuid, payment_link_id, visit_type, ip_address, browser, country_code) VALUES (?, ?, ?, ?, ?, ?)`,
      [randomUUID(), linkId, visitType, meta.ipAddress ?? null, meta.browser ?? null, meta.countryCode ?? null],
    );
    const col = visitType === 'view' ? 'visit_count' : visitType === 'abandon' ? 'abandonment_count' : 'payment_started_count';
    await this.pool.query(`UPDATE payment_links SET ${col} = ${col} + 1 WHERE id = ?`, [linkId]);
    await this.pool.query(
      `INSERT INTO payment_link_events (uuid, payment_link_id, event_type) VALUES (?, ?, ?)`,
      [randomUUID(), linkId, visitType === 'view' ? 'viewed' : visitType === 'complete' ? 'completed' : visitType],
    );
  }

  async getVisits(linkId: number, page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM payment_link_visits WHERE payment_link_id = ?', [linkId],
    );
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT * FROM payment_link_visits WHERE payment_link_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [linkId, pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async getLinkAnalytics(linkId: number) {
    const [link] = await this.pool.query<RowDataPacket[]>(
      'SELECT visit_count, payment_started_count, abandonment_count, current_usage FROM payment_links WHERE id = ?', [linkId],
    );
    const [events] = await this.pool.query<RowDataPacket[]>(
      'SELECT event_type, COUNT(*) AS cnt FROM payment_link_events WHERE payment_link_id = ? GROUP BY event_type', [linkId],
    );
    const visits = link[0]?.visit_count ?? 0;
    const completed = link[0]?.current_usage ?? 0;
    return {
      visits: Number(visits), abandonments: Number(link[0]?.abandonment_count ?? 0),
      payments: Number(completed),
      conversionRate: visits > 0 ? Math.round((completed / Number(visits)) * 1000) / 10 : 0,
      events,
    };
  }

  async findByShortCode(code: string): Promise<PaymentLinkRow | null> {
    const [rows] = await this.pool.query<PaymentLinkRow[]>(
      `${this.baseSelect} WHERE pl.short_code = ? AND pl.deleted_at IS NULL LIMIT 1`, [code],
    );
    return rows[0] ?? null;
  }
}
