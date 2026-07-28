import { randomBytes, randomUUID } from 'crypto';
import { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { appendMerchantOrgFilter, getOrganizationId } from '../../../shared/context/org-context';
import { CreateQrBodyDto, QrListQueryDto, UpdateQrBodyDto } from '../dto';

export interface QrCodeRow extends RowDataPacket {
  id: number; uuid: string; organization_id: number; merchant_id: number; customer_id: number | null;
  qr_ref: string; qr_type: string; title: string; description: string | null;
  amount: string | null; currency: string; allow_custom_amount: number; expires_at: string | null;
  scan_count: number; status: string; public_token: string;
  created_by: number | null; updated_by: number | null; created_at: string; updated_at: string;
  organization_name?: string; merchant_name?: string; customer_name?: string;
  created_by_name?: string; total_collected?: string;
}

export class QrPaymentRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  private baseSelect = `
    SELECT q.*, o.display_name AS organization_name, m.display_name AS merchant_name,
           c.display_name AS customer_name, CONCAT(u.first_name, ' ', u.last_name) AS created_by_name,
           (SELECT COALESCE(SUM(qt.paid_amount),0) FROM qr_transactions qt WHERE qt.qr_code_id = q.id) AS total_collected
    FROM qr_codes q
    JOIN organizations o ON o.id = q.organization_id
    JOIN merchants m ON m.id = q.merchant_id
    LEFT JOIN customers c ON c.id = q.customer_id
    LEFT JOIN users u ON u.id = q.created_by
  `;

  generateRef(): string { return `QR-${Math.floor(100000 + Math.random() * 900000)}`; }
  generateToken(): string { return randomBytes(24).toString('hex'); }

  async findAll(query: QrListQueryDto) {
    const { page, pageSize, search, status, qrType, merchantId, customerId, sortBy, sortOrder } = query;
    const conditions = ['q.deleted_at IS NULL'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('q.organization_id = ?'); params.push(orgId); }
    if (search) {
      conditions.push('(q.qr_ref LIKE ? OR q.title LIKE ? OR m.display_name LIKE ?)');
      const t = `%${search}%`; params.push(t, t, t);
    }
    if (status) { conditions.push('q.status = ?'); params.push(status); }
    if (qrType) { conditions.push('q.qr_type = ?'); params.push(qrType); }
    if (merchantId) { conditions.push('q.merchant_id = ?'); params.push(merchantId); }
    if (customerId) { conditions.push('q.customer_id = ?'); params.push(customerId); }
    appendMerchantOrgFilter(conditions, params);
    const where = `WHERE ${conditions.join(' AND ')}`;
    const sortCol = ['created_at', 'scan_count', 'amount', 'status'].includes(sortBy) ? sortBy : 'created_at';
    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM qr_codes q JOIN merchants m ON m.id = q.merchant_id ${where}`, params,
    );
    const [rows] = await this.pool.query<QrCodeRow[]>(
      `${this.baseSelect} ${where} ORDER BY q.${sortCol} ${sortOrder === 'asc' ? 'ASC' : 'DESC'} LIMIT ? OFFSET ?`,
      [...params, pageSize, (page - 1) * pageSize],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async getStatistics() {
    const conditions = ['q.deleted_at IS NULL'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('q.organization_id = ?'); params.push(orgId); }
    appendMerchantOrgFilter(conditions, params, 'm');
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN q.status = 'active' THEN 1 ELSE 0 END) AS active_count,
              SUM(CASE WHEN q.status = 'disabled' THEN 1 ELSE 0 END) AS disabled_count,
              COALESCE(SUM(q.scan_count), 0) AS total_scans,
              COALESCE((SELECT SUM(qt.paid_amount) FROM qr_transactions qt JOIN qr_codes qx ON qx.id = qt.qr_code_id WHERE qx.deleted_at IS NULL), 0) AS total_collected
       FROM qr_codes q JOIN merchants m ON m.id = q.merchant_id WHERE ${conditions.join(' AND ')}`, params,
    );
    return rows[0];
  }

  async findById(id: number): Promise<QrCodeRow | null> {
    const conditions = ['q.id = ?', 'q.deleted_at IS NULL'];
    const params: unknown[] = [id];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('q.organization_id = ?'); params.push(orgId); }
    const [rows] = await this.pool.query<QrCodeRow[]>(`${this.baseSelect} WHERE ${conditions.join(' AND ')}`, params);
    return rows[0] ?? null;
  }

  async findByToken(token: string): Promise<QrCodeRow | null> {
    const [rows] = await this.pool.query<QrCodeRow[]>(
      `${this.baseSelect} WHERE q.public_token = ? AND q.deleted_at IS NULL LIMIT 1`, [token],
    );
    return rows[0] ?? null;
  }

  async create(dto: CreateQrBodyDto, organizationId: number, userId?: number): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO qr_codes (uuid, organization_id, merchant_id, outlet_id, table_label, parent_qr_id, customer_id, qr_ref, qr_type, title, description,
        amount, currency, allow_custom_amount, expires_at, public_token, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), organizationId, dto.merchantId, dto.outletId ?? null, dto.tableLabel ?? null, dto.parentQrId ?? null,
        dto.customerId ?? null, this.generateRef(), dto.qrType ?? 'static', dto.title, dto.description ?? null, dto.amount ?? null,
        dto.currency ?? 'USD', dto.allowCustomAmount ? 1 : 0, dto.expiresAt ?? null, this.generateToken(), userId ?? null],
    );
    return result.insertId;
  }

  async update(id: number, dto: UpdateQrBodyDto, userId?: number): Promise<void> {
    const fields: string[] = [];
    const params: unknown[] = [];
    if (dto.title !== undefined) { fields.push('title = ?'); params.push(dto.title); }
    if (dto.description !== undefined) { fields.push('description = ?'); params.push(dto.description); }
    if (dto.amount !== undefined) { fields.push('amount = ?'); params.push(dto.amount); }
    if (dto.currency !== undefined) { fields.push('currency = ?'); params.push(dto.currency); }
    if (dto.allowCustomAmount !== undefined) { fields.push('allow_custom_amount = ?'); params.push(dto.allowCustomAmount ? 1 : 0); }
    if (dto.expiresAt !== undefined) { fields.push('expires_at = ?'); params.push(dto.expiresAt || null); }
    if (!fields.length) return;
    fields.push('updated_by = ?'); params.push(userId ?? null, id);
    await this.pool.query(`UPDATE qr_codes SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`, params);
  }

  async setStatus(id: number, status: string, userId?: number): Promise<void> {
    await this.pool.query(`UPDATE qr_codes SET status = ?, updated_by = ? WHERE id = ? AND deleted_at IS NULL`, [status, userId ?? null, id]);
  }

  async regenerateToken(id: number, userId?: number): Promise<string> {
    const token = this.generateToken();
    await this.pool.query(`UPDATE qr_codes SET public_token = ?, updated_by = ? WHERE id = ? AND deleted_at IS NULL`, [token, userId ?? null, id]);
    return token;
  }

  async recordPayment(conn: PoolConnection, qrId: number, transactionId: number, amount: number): Promise<void> {
    await conn.query(`INSERT INTO qr_transactions (qr_code_id, transaction_id, paid_amount) VALUES (?, ?, ?)`, [qrId, transactionId, amount]);
    await conn.query(`UPDATE qr_codes SET scan_count = scan_count + 1, updated_at = NOW() WHERE id = ?`, [qrId]);
  }

  async validateMerchantInOrg(merchantId: number, organizationId: number): Promise<boolean> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id FROM merchants WHERE id = ? AND organization_id = ? AND deleted_at IS NULL LIMIT 1`, [merchantId, organizationId],
    );
    return !!rows[0];
  }

  async validateCustomerInOrg(customerId: number, organizationId: number): Promise<boolean> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id FROM customers WHERE id = ? AND organization_id = ? AND deleted_at IS NULL LIMIT 1`, [customerId, organizationId],
    );
    return !!rows[0];
  }

  async clone(id: number, organizationId: number, userId?: number): Promise<number> {
    const source = await this.findById(id);
    if (!source) throw new Error('QR not found');
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO qr_codes (uuid, organization_id, merchant_id, outlet_id, device_id, customer_id, qr_ref, qr_type, title, description,
        amount, currency, allow_custom_amount, is_one_time, is_reusable, amount_locked, template_id, category_id, clone_of_id, public_token, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CONCAT(?, ' (Copy)'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), organizationId, source.merchant_id, (source as QrCodeRow & { outlet_id?: number }).outlet_id ?? null,
        (source as QrCodeRow & { device_id?: number }).device_id ?? null, source.customer_id,
        this.generateRef(), source.qr_type, source.title, source.description, source.amount, source.currency,
        source.allow_custom_amount, (source as QrCodeRow & { is_one_time?: number }).is_one_time ?? 0,
        (source as QrCodeRow & { is_reusable?: number }).is_reusable ?? 1,
        (source as QrCodeRow & { amount_locked?: number }).amount_locked ?? 0,
        (source as QrCodeRow & { template_id?: number }).template_id ?? null,
        (source as QrCodeRow & { category_id?: number }).category_id ?? null, id, this.generateToken(), userId ?? null],
    );
    return result.insertId;
  }

  async archive(id: number, userId?: number): Promise<void> {
    await this.pool.query(
      `UPDATE qr_codes SET status = 'archived', archived_at = NOW(), updated_by = ? WHERE id = ? AND deleted_at IS NULL`,
      [userId ?? null, id],
    );
  }

  async bulkCreate(items: CreateQrBodyDto[], organizationId: number, userId?: number): Promise<number[]> {
    const ids: number[] = [];
    for (const dto of items) {
      ids.push(await this.create(dto, organizationId, userId));
    }
    return ids;
  }

  async recordScan(qrId: number, meta: Record<string, unknown>, result: string, amount?: number, txId?: number): Promise<void> {
    const row = await this.findById(qrId);
    if (!row) return;
    await this.pool.query(
      `INSERT INTO qr_scan_history (uuid, qr_code_id, organization_id, merchant_id, scan_result, paid_amount, transaction_id, ip_address, browser, country_code, device_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), qrId, row.organization_id, row.merchant_id, result, amount ?? null, txId ?? null,
        meta.ipAddress ?? null, meta.browser ?? null, meta.countryCode ?? null, meta.deviceType ?? null],
    );
    await this.pool.query(`UPDATE qr_codes SET scan_count = scan_count + 1 WHERE id = ?`, [qrId]);
  }

  async getScanHistory(qrId: number, page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM qr_scan_history WHERE qr_code_id = ?', [qrId],
    );
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT * FROM qr_scan_history WHERE qr_code_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?', [qrId, pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async listTemplates(): Promise<RowDataPacket[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>('SELECT * FROM qr_templates WHERE is_active = 1 ORDER BY name');
    return rows;
  }

  async listCategories(orgId: number): Promise<RowDataPacket[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT * FROM qr_categories WHERE organization_id = ? AND is_active = 1 ORDER BY name', [orgId],
    );
    return rows;
  }
}
