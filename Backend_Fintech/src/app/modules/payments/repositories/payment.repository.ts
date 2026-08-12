import { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { getPool } from '../../../database';
import { requireOrgId } from '../../../shared/helpers/tenant-scope.helper';
import { PaymentIntentStatus } from '../constants/payment-status';

export class PaymentRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  private db(conn?: PoolConnection): Pool | PoolConnection {
    return conn ?? this.pool;
  }
  private generateRef(prefix: string): string {
    return `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
  }

  async findIntentById(id: number, conn?: PoolConnection, forUpdate = false): Promise<RowDataPacket | null> {
    const orgId = requireOrgId();
    const params: unknown[] = [id, orgId];
    const lock = forUpdate ? ' FOR UPDATE' : '';
    const [rows] = await this.db(conn).query<RowDataPacket[]>(
      `SELECT pi.*, pmt.code AS payment_method_code_label, m.display_name AS merchant_name
       FROM payment_intents pi
       JOIN merchants m ON m.id = pi.merchant_id
       LEFT JOIN payment_method_types pmt ON pmt.id = pi.payment_method_type_id
       WHERE pi.id = ? AND pi.organization_id = ?${lock}`, params,
    );
    return rows[0] ?? null;
  }
  async findIntentByRef(ref: string): Promise<RowDataPacket | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT * FROM payment_intents WHERE intent_ref = ?', [ref],
    );
    return rows[0] ?? null;
  }

  async listIntents(query: { page: number; pageSize: number; status?: string; merchantId?: number; search?: string }) {
    const conditions = ['pi.organization_id = ?'];
    const params: unknown[] = [requireOrgId()];
    if (query.status) { conditions.push('pi.status = ?'); params.push(query.status); }
    if (query.merchantId) { conditions.push('pi.merchant_id = ?'); params.push(query.merchantId); }
    if (query.search) {
      conditions.push('(pi.intent_ref LIKE ? OR pi.merchant_order_id LIKE ? OR pi.gateway_transaction_id LIKE ? OR pi.rrn LIKE ?)');
      const t = `%${query.search}%`;
      params.push(t, t, t, t);
    }
    const where = conditions.join(' AND ');
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM payment_intents pi WHERE ${where}`, params,
    );
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT pi.*, m.display_name AS merchant_name FROM payment_intents pi
       JOIN merchants m ON m.id = pi.merchant_id
       WHERE ${where} ORDER BY pi.created_at DESC LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async createOrder(data: Record<string, unknown>, orgId: number, actorId?: number, conn?: PoolConnection): Promise<number> {
    const [result] = await this.db(conn).query<ResultSetHeader>(
      `INSERT INTO payment_orders (uuid, order_ref, merchant_order_id, merchant_id, organization_id, customer_id,
        status, currency, amount, description, metadata, expires_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), this.generateRef('ORD'), data.merchantOrderId ?? null, data.merchantId, orgId,
        data.customerId ?? null, data.status ?? 'pending', data.currency ?? 'USD', data.amount,
        data.description ?? null, data.metadata ? JSON.stringify(data.metadata) : null,
        data.expiresAt ?? null, actorId ?? null],
    );
    return result.insertId;
  }

  async createIntent(data: Record<string, unknown>, orgId: number, actorId?: number, conn?: PoolConnection): Promise<number> {
    const [result] = await this.db(conn).query<ResultSetHeader>(
      `INSERT INTO payment_intents (uuid, intent_ref, order_id, merchant_id, organization_id, customer_id,
        status, amount, currency, payment_method_type_id, payment_method_code, idempotency_key,
        merchant_order_id, gateway_transaction_id, metadata, expires_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), this.generateRef('PI'), data.orderId ?? null, data.merchantId, orgId,
        data.customerId ?? null, data.amount, data.currency ?? 'USD', data.paymentMethodTypeId ?? null,
        data.paymentMethodCode ?? null, data.idempotencyKey ?? null, data.merchantOrderId ?? null,
        data.gatewayTransactionId ?? this.generateRef('GWX'), data.metadata ? JSON.stringify(data.metadata) : null,
        data.expiresAt ?? null, actorId ?? null],
    );
    return result.insertId;
  }

  async createSession(data: Record<string, unknown>, orgId: number, conn?: PoolConnection): Promise<number> {
    const secret = `cs_${randomBytes(24).toString('hex')}`;
    const [result] = await this.db(conn).query<ResultSetHeader>(
      `INSERT INTO payment_sessions (uuid, session_ref, merchant_id, organization_id, customer_id, order_id,
        payment_intent_id, amount, currency, client_secret, ip_address, user_agent, browser, device_id, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), this.generateRef('PS'), data.merchantId, orgId, data.customerId ?? null,
        data.orderId ?? null, data.paymentIntentId ?? null, data.amount, data.currency ?? 'USD', secret,
        data.ipAddress ?? null, data.userAgent ?? null, data.browser ?? null, data.deviceId ?? null,
        data.expiresAt ?? new Date(Date.now() + 30 * 60 * 1000)],
    );
    return result.insertId;
  }

  async getSessionById(id: number): Promise<RowDataPacket | null> {
    const orgId = requireOrgId();
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT * FROM payment_sessions WHERE id = ? AND organization_id = ?', [id, orgId],
    );
    return rows[0] ?? null;
  }

  async updateIntentPaymentMethod(id: number, paymentMethodCode: string, conn?: PoolConnection): Promise<void> {
    await this.db(conn).query(
      'UPDATE payment_intents SET payment_method_code = ? WHERE id = ?',
      [paymentMethodCode, id],
    );
  }

  async updateIntentStatus(id: number, status: PaymentIntentStatus, extra: Record<string, unknown> = {}, conn?: PoolConnection): Promise<void> {
    const sets = ['status = ?'];
    const params: unknown[] = [status];
    if (extra.amountCaptured != null) { sets.push('amount_captured = ?'); params.push(extra.amountCaptured); }
    if (extra.amountRefunded != null) { sets.push('amount_refunded = ?'); params.push(extra.amountRefunded); }
    if (extra.transactionId != null) { sets.push('transaction_id = ?'); params.push(extra.transactionId); }
    if (extra.acquirerReference != null) { sets.push('acquirer_reference = ?'); params.push(extra.acquirerReference); }
    if (extra.gatewayTransactionId != null) { sets.push('gateway_transaction_id = ?'); params.push(extra.gatewayTransactionId); }
    if (extra.rrn != null) { sets.push('rrn = ?'); params.push(extra.rrn); }
    if (extra.failureReason != null) { sets.push('failure_reason = ?'); params.push(extra.failureReason); }
    if (status === 'authorized') { sets.push('authorized_at = NOW()'); }
    if (status === 'captured') { sets.push('captured_at = NOW()'); }
    if (status === 'settled') { sets.push('settled_at = NOW()'); }
    params.push(id);
    await this.db(conn).query(`UPDATE payment_intents SET ${sets.join(', ')} WHERE id = ?`, params);
  }

  async addTimelineEvent(intentId: number, eventType: string, fromStatus: string | null, toStatus: string | null, description: string, actorId?: number, metadata?: Record<string, unknown>, conn?: PoolConnection): Promise<void> {
    await this.db(conn).query(
      `INSERT INTO payment_timeline_events (uuid, payment_intent_id, event_type, from_status, to_status, description, metadata, actor_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), intentId, eventType, fromStatus, toStatus, description,
        metadata ? JSON.stringify(metadata) : null, actorId ?? null],
    );
  }

  async getTimeline(intentId: number): Promise<RowDataPacket[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT pte.*, CONCAT(u.first_name,' ',u.last_name) AS actor_name
       FROM payment_timeline_events pte
       LEFT JOIN users u ON u.id = pte.actor_id
       WHERE pte.payment_intent_id = ? ORDER BY pte.created_at ASC`, [intentId],
    );
    return rows;
  }

  async findOrderById(id: number): Promise<RowDataPacket | null> {
    const orgId = requireOrgId();
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT * FROM payment_orders WHERE id = ? AND organization_id = ?', [id, orgId],
    );
    return rows[0] ?? null;
  }

  async listOrders(query: { page: number; pageSize: number; status?: string; merchantId?: number }) {
    const conditions = ['organization_id = ?'];
    const params: unknown[] = [requireOrgId()];
    if (query.status) { conditions.push('status = ?'); params.push(query.status); }
    if (query.merchantId) { conditions.push('merchant_id = ?'); params.push(query.merchantId); }
    const where = conditions.join(' AND ');
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM payment_orders WHERE ${where}`, params,
    );
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT * FROM payment_orders WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async updateOrderPayment(orderId: number, amountPaid: number, status: string, conn?: PoolConnection): Promise<void> {
    await this.db(conn).query(
      'UPDATE payment_orders SET amount_paid = ?, status = ? WHERE id = ?',
      [amountPaid, status, orderId],
    );
  }

  async getIdempotency(merchantId: number, key: string, conn?: PoolConnection, forUpdate = false): Promise<RowDataPacket | null> {
    const hash = createHash('sha256').update(key).digest('hex');
    const lock = forUpdate ? ' FOR UPDATE' : '';
    const [rows] = await this.db(conn).query<RowDataPacket[]>(
      `SELECT * FROM payment_idempotency_keys WHERE merchant_id = ? AND key_hash = ? AND expires_at > NOW()${lock}`,
      [merchantId, hash],
    );
    return rows[0] ?? null;
  }

  async saveIdempotency(merchantId: number, orgId: number, key: string, path: string, status: number, body: unknown, conn?: PoolConnection): Promise<void> {
    const hash = createHash('sha256').update(key).digest('hex');
    await this.db(conn).query(
      `INSERT INTO payment_idempotency_keys (key_hash, merchant_id, organization_id, request_path, response_status, response_body, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))
       ON DUPLICATE KEY UPDATE response_status = VALUES(response_status), response_body = VALUES(response_body)`,
      [hash, merchantId, orgId, path, status, JSON.stringify(body)],
    );
  }

  async listCustomerMethods(customerId: number): Promise<RowDataPacket[]> {
    const orgId = requireOrgId();
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT * FROM customer_payment_methods WHERE customer_id = ? AND is_active = 1
       AND organization_id = ? ORDER BY is_default DESC`,
      [customerId, orgId],
    );
    return rows;
  }

  async createTransactionFromIntent(intent: RowDataPacket, amount: number, actorId?: number, conn?: PoolConnection): Promise<number> {
    const feeAmount = Math.round(amount * 0.025 * 100) / 100;
    const [merchantRows] = await this.db(conn).query<RowDataPacket[]>(
      'SELECT region_id FROM merchants WHERE id = ? AND organization_id = ?', [intent.merchant_id, intent.organization_id],
    );
    if (!merchantRows[0]) throw new Error('Merchant not found for transaction');
    const [statusRows] = await this.db(conn).query<RowDataPacket[]>(
      "SELECT id FROM transaction_statuses WHERE code = 'success' LIMIT 1",
    );
    const ref = `TXN-PI-${Math.floor(100000 + Math.random() * 900000)}`;
    const [result] = await this.db(conn).query<ResultSetHeader>(
      `INSERT INTO transactions (uuid, transaction_ref, merchant_id, customer_id, payment_intent_id,
        description, amount, fee_amount, net_amount, currency, payment_method_type_id, payment_method_detail,
        status_id, region_id, processed_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [randomUUID(), ref, intent.merchant_id, intent.customer_id, intent.id,
        `Payment ${intent.intent_ref}`, amount, feeAmount, amount - feeAmount,
        intent.currency, intent.payment_method_type_id ?? 1, intent.payment_method_code ?? 'card',
        statusRows[0]?.id ?? 1, merchantRows[0]?.region_id ?? 1, actorId ?? null],
    );
    return result.insertId;
  }

  async listWebhookDeliveries(merchantId?: number, limit = 50): Promise<RowDataPacket[]> {
    const conditions = ['1=1'];
    const params: unknown[] = [];
    if (merchantId) { conditions.push('merchant_id = ?'); params.push(merchantId); }
    params.push(limit);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT * FROM payment_webhook_deliveries WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT ?`, params,
    );
    return rows;
  }

  async enqueueWebhook(merchantId: number, intentId: number, eventType: string, url: string, payload: Record<string, unknown>): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO payment_webhook_deliveries (uuid, merchant_id, payment_intent_id, event_type, webhook_url, payload, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [randomUUID(), merchantId, intentId, eventType, url, JSON.stringify(payload)],
    );
    return result.insertId;
  }

  async getMerchantWebhookUrl(merchantId: number): Promise<string | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT url FROM merchant_webhooks WHERE merchant_id = ? AND is_active = 1 ORDER BY id LIMIT 1`, [merchantId],
    );
    return rows[0]?.url ? String(rows[0].url) : null;
  }
}
