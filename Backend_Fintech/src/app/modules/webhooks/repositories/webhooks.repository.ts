import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { getOrganizationId } from '../../../shared/context/org-context';
import { encryptSecret } from '../../../shared/crypto/secret-crypto';

export class WebhooksRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async getDashboardStats() {
    const orgId = getOrganizationId();
    const params: unknown[] = [];
    let orgClause = '';
    if (orgId) { orgClause = ' AND (mw.organization_id = ? OR m.organization_id = ?)'; params.push(orgId, orgId); }
    const [webhooks] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN mw.is_active=1 THEN 1 ELSE 0 END) AS active,
              SUM(CASE WHEN mw.health_status='failing' THEN 1 ELSE 0 END) AS failing
       FROM merchant_webhooks mw JOIN merchants m ON m.id = mw.merchant_id
       WHERE mw.deleted_at IS NULL${orgClause}`, params,
    );
    const deliveryParams = orgId ? [orgId] : [];
    const deliveryOrg = orgId ? ' AND m.organization_id = ?' : '';
    const [deliveries] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS pending, SUM(CASE WHEN wdq.status='failed' THEN 1 ELSE 0 END) AS failed,
              SUM(CASE WHEN wdq.status='dead_letter' THEN 1 ELSE 0 END) AS dead_letter
       FROM webhook_delivery_queue wdq JOIN merchants m ON m.id = wdq.merchant_id
       WHERE wdq.status IN ('pending','processing','failed','dead_letter')${deliveryOrg}`, deliveryParams,
    );
    return { webhooks: webhooks[0], deliveries: deliveries[0] };
  }

  async listWebhooks(query: { page: number; pageSize: number; merchantId?: number; isActive?: boolean }) {
    const conditions = ['mw.deleted_at IS NULL'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('m.organization_id = ?'); params.push(orgId); }
    if (query.merchantId) { conditions.push('mw.merchant_id = ?'); params.push(query.merchantId); }
    if (query.isActive != null) { conditions.push('mw.is_active = ?'); params.push(query.isActive ? 1 : 0); }
    const where = conditions.join(' AND ');
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM merchant_webhooks mw JOIN merchants m ON m.id = mw.merchant_id WHERE ${where}`, params,
    );
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT mw.*, m.display_name AS merchant_name FROM merchant_webhooks mw
       JOIN merchants m ON m.id = mw.merchant_id WHERE ${where} ORDER BY mw.created_at DESC LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async findWebhook(id: number): Promise<RowDataPacket | null> {
    const orgId = getOrganizationId();
    const params: unknown[] = [id];
    let orgClause = '';
    if (orgId) { orgClause = ' AND m.organization_id = ?'; params.push(orgId); }
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT mw.*, m.display_name AS merchant_name FROM merchant_webhooks mw
       JOIN merchants m ON m.id = mw.merchant_id WHERE mw.id = ? AND mw.deleted_at IS NULL${orgClause}`, params,
    );
    return rows[0] ?? null;
  }

  async createWebhook(data: Record<string, unknown>, orgId: number): Promise<number> {
    const secret = randomBytes(32).toString('hex');
    const secretHash = createHash('sha256').update(secret).digest('hex');
    const secretEncrypted = encryptSecret(secret);
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO merchant_webhooks (uuid, merchant_id, organization_id, url, description, event_types, secret_hash, secret_encrypted, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [randomUUID(), data.merchantId, orgId, data.url, data.description ?? null,
        JSON.stringify(data.eventTypes ?? []), secretHash, secretEncrypted],
    );
    return result.insertId;
  }

  async updateWebhook(id: number, data: Record<string, unknown>): Promise<void> {
    const orgId = getOrganizationId();
    const params: unknown[] = [data.url, data.description ?? null, JSON.stringify(data.eventTypes ?? []), data.isActive ?? 1, id];
    let orgClause = '';
    if (orgId) { orgClause = ' AND organization_id = ?'; params.push(orgId); }
    await this.pool.query(
      `UPDATE merchant_webhooks SET url = ?, description = ?, event_types = ?, is_active = ? WHERE id = ? AND deleted_at IS NULL${orgClause}`, params,
    );
  }

  async deleteWebhook(id: number): Promise<void> {
    const orgId = getOrganizationId();
    const params: unknown[] = [id];
    let orgClause = '';
    if (orgId) { orgClause = ' AND organization_id = ?'; params.push(orgId); }
    await this.pool.query(`UPDATE merchant_webhooks SET deleted_at = NOW() WHERE id = ?${orgClause}`, params);
  }

  async listSubscriptions(webhookId: number) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT * FROM webhook_event_subscriptions WHERE webhook_id = ? ORDER BY created_at DESC', [webhookId],
    );
    return rows;
  }

  async createSubscription(webhookId: number, data: Record<string, unknown>): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO webhook_event_subscriptions (uuid, webhook_id, event_category, event_type, is_enabled)
       VALUES (?, ?, ?, ?, ?)`,
      [randomUUID(), webhookId, data.eventCategory, data.eventType, data.isEnabled ?? 1],
    );
    return result.insertId;
  }

  async updateSubscription(id: number, data: Record<string, unknown>): Promise<void> {
    await this.pool.query(
      'UPDATE webhook_event_subscriptions SET event_category = ?, event_type = ?, is_enabled = ? WHERE id = ?',
      [data.eventCategory, data.eventType, data.isEnabled ?? 1, id],
    );
  }

  async deleteSubscription(id: number): Promise<void> {
    await this.pool.query('DELETE FROM webhook_event_subscriptions WHERE id = ?', [id]);
  }

  async listDeliveries(query: { page: number; pageSize: number; status?: string; webhookId?: number }) {
    const conditions = ['1=1'];
    const params: unknown[] = [];
    const orgId = getOrganizationId();
    if (orgId) { conditions.push('m.organization_id = ?'); params.push(orgId); }
    if (query.status) { conditions.push('wdq.status = ?'); params.push(query.status); }
    if (query.webhookId) { conditions.push('wdq.webhook_id = ?'); params.push(query.webhookId); }
    const where = conditions.join(' AND ');
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM webhook_delivery_queue wdq JOIN merchants m ON m.id = wdq.merchant_id WHERE ${where}`, params,
    );
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT wdq.*, mw.url AS webhook_url FROM webhook_delivery_queue wdq
       JOIN merchant_webhooks mw ON mw.id = wdq.webhook_id
       JOIN merchants m ON m.id = wdq.merchant_id WHERE ${where} ORDER BY wdq.created_at DESC LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async findDelivery(id: number): Promise<RowDataPacket | null> {
    const orgId = getOrganizationId();
    const params: unknown[] = [id];
    let orgClause = '';
    if (orgId) { orgClause = ' AND m.organization_id = ?'; params.push(orgId); }
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT wdq.* FROM webhook_delivery_queue wdq JOIN merchants m ON m.id = wdq.merchant_id WHERE wdq.id = ?${orgClause}`, params,
    );
    return rows[0] ?? null;
  }

  async retryDelivery(id: number): Promise<void> {
    await this.pool.query(
      `UPDATE webhook_delivery_queue SET status = 'pending', next_retry_at = NOW(), last_error = NULL WHERE id = ?`, [id],
    );
  }

  async listReplayHistory(deliveryId: number) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      'SELECT * FROM webhook_replay_history WHERE delivery_id = ? ORDER BY created_at DESC', [deliveryId],
    );
    return rows;
  }

  async createReplay(
    deliveryId: number,
    actorId?: number,
    reason?: string,
    replayStatus: 'pending' | 'success' | 'failed' = 'pending',
  ): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO webhook_replay_history (uuid, delivery_id, replayed_by, replay_reason, replay_status)
       VALUES (?, ?, ?, ?, ?)`,
      [randomUUID(), deliveryId, actorId ?? null, reason ?? null, replayStatus],
    );
    return result.insertId;
  }

  async updateReplayStatus(replayId: number, replayStatus: 'success' | 'failed'): Promise<void> {
    await this.pool.query(
      `UPDATE webhook_replay_history SET replay_status = ? WHERE id = ?`,
      [replayStatus, replayId],
    );
  }
}
