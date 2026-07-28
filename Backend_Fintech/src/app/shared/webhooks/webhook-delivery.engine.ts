import { createHmac, randomUUID } from 'node:crypto';
import { Pool, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../database';
import { env } from '../../config';
import { resolveSecret } from '../crypto/secret-crypto';
import { recordMetric } from '../observability/metrics.registry';
import { logger } from '../logger';

export interface WebhookDeliveryInput {
  url: string;
  payload: Record<string, unknown>;
  eventType: string;
  signingSecret?: string | null;
  idempotencyKey?: string;
  correlationId?: string;
  timeoutMs?: number;
}

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode: number | null;
  error: string | null;
  durationMs: number;
  responseBody?: string;
}

function computeBackoffSeconds(attempt: number): number {
  const base = env.worker.webhookRetryBaseSeconds;
  return Math.min(base * 2 ** Math.max(0, attempt - 1), env.worker.webhookRetryMaxSeconds);
}

function signPayload(body: string, secret: string, timestamp: number): string {
  const signedPayload = `${timestamp}.${body}`;
  return createHmac('sha256', secret).update(signedPayload).digest('hex');
}

export async function deliverWebhookHttp(input: WebhookDeliveryInput): Promise<WebhookDeliveryResult> {
  const started = Date.now();
  const body = JSON.stringify(input.payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const idempotencyKey = input.idempotencyKey ?? randomUUID();
  const correlationId = input.correlationId ?? randomUUID();
  const timeoutMs = input.timeoutMs ?? env.worker.webhookTimeoutMs;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'FintechPlatform-Webhook/1.0',
    'X-Webhook-Timestamp': String(timestamp),
    'X-Idempotency-Key': idempotencyKey,
    'X-Correlation-Id': correlationId,
    'X-Event-Type': input.eventType,
  };

  if (input.signingSecret) {
    headers['X-Webhook-Signature'] = `t=${timestamp},v1=${signPayload(body, input.signingSecret, timestamp)}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(input.url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    });
    const responseText = await response.text().catch(() => '');
    const durationMs = Date.now() - started;
    const success = response.status >= 200 && response.status < 300;
    recordMetric('webhook.delivery', success, durationMs, success ? undefined : `http_${response.status}`);
    logger.info('Webhook delivery attempt', {
      correlationId,
      eventType: input.eventType,
      url: input.url,
      statusCode: response.status,
      success,
      durationMs,
    });
    return {
      success,
      statusCode: response.status,
      error: success ? null : `HTTP ${response.status}: ${responseText.slice(0, 200)}`,
      durationMs,
      responseBody: responseText.slice(0, 500),
    };
  } catch (err) {
    const durationMs = Date.now() - started;
    const message = err instanceof Error ? err.message : String(err);
    recordMetric('webhook.delivery', false, durationMs, 'network_error');
    logger.warn('Webhook delivery failed', { correlationId, eventType: input.eventType, url: input.url, error: message, durationMs });
    return { success: false, statusCode: null, error: message, durationMs };
  } finally {
    clearTimeout(timer);
  }
}

export class WebhookDeliveryProcessor {
  constructor(private readonly pool: Pool = getPool()) {}

  async processPaymentWebhookDelivery(deliveryId: number): Promise<boolean> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT pwd.*, mw.secret_encrypted, mw.secret_hash
       FROM payment_webhook_deliveries pwd
       LEFT JOIN merchant_webhooks mw ON mw.merchant_id = pwd.merchant_id AND mw.is_active = 1 AND mw.deleted_at IS NULL
       WHERE pwd.id = ? AND pwd.status IN ('pending','failed')
         AND pwd.attempt_count < pwd.max_attempts
         AND (pwd.next_retry_at IS NULL OR pwd.next_retry_at <= NOW())
       LIMIT 1`,
      [deliveryId],
    );
    const row = rows[0];
    if (!row) return false;

    const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
    const signingSecret = resolveSecret(row.secret_encrypted as string | null, true)
      ?? (row.secret_hash ? String(row.secret_hash) : null);

    const result = await deliverWebhookHttp({
      url: String(row.webhook_url),
      payload: payload as Record<string, unknown>,
      eventType: String(row.event_type),
      signingSecret,
      idempotencyKey: String(row.uuid),
      correlationId: String(row.uuid),
    });

    const attempt = Number(row.attempt_count) + 1;
    if (result.success) {
      await this.pool.query(
        `UPDATE payment_webhook_deliveries SET status = 'delivered', attempt_count = ?, last_response_code = ?,
         last_error = NULL, delivered_at = NOW(), next_retry_at = NULL WHERE id = ?`,
        [attempt, result.statusCode, deliveryId],
      );
      await this.updateWebhookLog(String(row.event_type), String(row.webhook_url), true, result.statusCode, attempt);
      return true;
    }

    const exhausted = attempt >= Number(row.max_attempts);
    const nextRetry = exhausted ? null : new Date(Date.now() + computeBackoffSeconds(attempt) * 1000);
    await this.pool.query(
      `UPDATE payment_webhook_deliveries SET status = 'failed', attempt_count = ?, last_response_code = ?,
       last_error = ?, next_retry_at = ? WHERE id = ?`,
      [attempt, result.statusCode, result.error?.slice(0, 500) ?? 'Delivery failed', nextRetry, deliveryId],
    );
    await this.updateWebhookLog(String(row.event_type), String(row.webhook_url), false, result.statusCode, attempt);
    return false;
  }

  async processQueueDelivery(deliveryId: number): Promise<boolean> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT wdq.*, mw.url AS webhook_url, mw.secret_encrypted, mw.secret_hash
       FROM webhook_delivery_queue wdq
       JOIN merchant_webhooks mw ON mw.id = wdq.webhook_id
       WHERE wdq.id = ? AND wdq.status IN ('pending','failed','processing')
         AND wdq.attempt_count < wdq.max_attempts
         AND (wdq.next_retry_at IS NULL OR wdq.next_retry_at <= NOW())
       LIMIT 1`,
      [deliveryId],
    );
    const row = rows[0];
    if (!row) return false;

    await this.pool.query(`UPDATE webhook_delivery_queue SET status = 'processing' WHERE id = ?`, [deliveryId]);

    const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
    const signingSecret = resolveSecret(row.secret_encrypted as string | null, true)
      ?? (row.secret_hash ? String(row.secret_hash) : null);

    const result = await deliverWebhookHttp({
      url: String(row.webhook_url),
      payload: payload as Record<string, unknown>,
      eventType: String(row.event_type),
      signingSecret,
      idempotencyKey: String(row.uuid),
      correlationId: String(row.uuid),
    });

    const attempt = Number(row.attempt_count) + 1;
    if (result.success) {
      await this.pool.query(
        `UPDATE webhook_delivery_queue SET status = 'delivered', attempt_count = ?, last_response_code = ?,
         last_error = NULL, delivered_at = NOW(), next_retry_at = NULL, signature = ? WHERE id = ?`,
        [attempt, result.statusCode, result.responseBody?.slice(0, 128) ?? null, deliveryId],
      );
      return true;
    }

    const exhausted = attempt >= Number(row.max_attempts);
    const status = exhausted ? 'dead_letter' : 'failed';
    const nextRetry = exhausted ? null : new Date(Date.now() + computeBackoffSeconds(attempt) * 1000);
    await this.pool.query(
      `UPDATE webhook_delivery_queue SET status = ?, attempt_count = ?, last_response_code = ?,
       last_error = ?, next_retry_at = ? WHERE id = ?`,
      [status, attempt, result.statusCode, result.error?.slice(0, 500) ?? 'Delivery failed', nextRetry, deliveryId],
    );
    return false;
  }

  async claimPendingPaymentWebhooks(limit: number): Promise<number[]> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM payment_webhook_deliveries
         WHERE status IN ('pending','failed') AND attempt_count < max_attempts
           AND (next_retry_at IS NULL OR next_retry_at <= NOW())
         ORDER BY created_at ASC LIMIT ? FOR UPDATE`,
        [limit],
      );
      const ids = rows.map((r) => Number(r.id));
      await conn.commit();
      return ids;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async claimPendingQueueDeliveries(limit: number): Promise<number[]> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.query<RowDataPacket[]>(
        `SELECT id FROM webhook_delivery_queue
         WHERE status IN ('pending','failed') AND attempt_count < max_attempts
           AND (next_retry_at IS NULL OR next_retry_at <= NOW())
         ORDER BY created_at ASC LIMIT ? FOR UPDATE`,
        [limit],
      );
      const ids = rows.map((r) => Number(r.id));
      if (ids.length) {
        await conn.query(
          `UPDATE webhook_delivery_queue SET status = 'processing'
           WHERE id IN (${ids.map(() => '?').join(',')})`,
          ids,
        );
      }
      await conn.commit();
      return ids;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  private async updateWebhookLog(
    eventType: string, url: string, success: boolean, statusCode: number | null, attempt: number,
  ): Promise<void> {
    try {
      await this.pool.query(
        `UPDATE webhook_logs SET status = ?, status_code = ?, attempt_count = ?,
         delivered_at = CASE WHEN ? = 'success' THEN NOW() ELSE delivered_at END,
         last_error = CASE WHEN ? = 'failed' THEN COALESCE(last_error, 'Delivery failed') ELSE last_error END
         WHERE event_type = ? AND url = ? ORDER BY id DESC LIMIT 1`,
        [success ? 'success' : 'failed', statusCode, attempt, success ? 'success' : 'failed', success ? 'success' : 'failed', eventType, url],
      );
    } catch { /* best effort */ }
  }
}

export const webhookDeliveryProcessor = new WebhookDeliveryProcessor();

export { computeBackoffSeconds };
