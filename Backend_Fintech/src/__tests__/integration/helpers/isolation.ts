import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../app/database/connection';

type CleanupEntry =
  | { kind: 'payment_intent'; id: number }
  | { kind: 'merchant'; id: number }
  | { kind: 'user'; id: number }
  | { kind: 'background_job'; id: number }
  | { kind: 'webhook'; id: number }
  | { kind: 'webhook_delivery'; id: number }
  | { kind: 'checkout_session'; id: number }
  | { kind: 'user_email'; email: string }
  | { kind: 'retry_queue'; id: number }
  | { kind: 'notification'; id: number };

const cleanupEntries: CleanupEntry[] = [];

export function trackPaymentIntent(id: number): void {
  cleanupEntries.push({ kind: 'payment_intent', id });
}

export function trackMerchant(id: number): void {
  cleanupEntries.push({ kind: 'merchant', id });
}

export function trackUser(id: number): void {
  cleanupEntries.push({ kind: 'user', id });
}

export function trackUserEmail(email: string): void {
  cleanupEntries.push({ kind: 'user_email', email });
}

export function trackBackgroundJob(id: number): void {
  cleanupEntries.push({ kind: 'background_job', id });
}

export function trackWebhook(id: number): void {
  cleanupEntries.push({ kind: 'webhook', id });
}

export function trackWebhookDelivery(id: number): void {
  cleanupEntries.push({ kind: 'webhook_delivery', id });
}

export function trackCheckoutSession(id: number): void {
  cleanupEntries.push({ kind: 'checkout_session', id });
}

export function trackRetryQueueItem(id: number): void {
  cleanupEntries.push({ kind: 'retry_queue', id });
}

export function trackNotification(id: number): void {
  cleanupEntries.push({ kind: 'notification', id });
}

export async function runTestCleanup(pool: Pool = getPool()): Promise<void> {
  try {
    await pool.query(
      `UPDATE background_jobs
       SET status = 'queued', started_at = NULL, completed_at = NULL
       WHERE status = 'running' AND started_at < DATE_SUB(NOW(), INTERVAL 2 MINUTE)`,
    );
    await pool.query(
      `DELETE FROM background_jobs
       WHERE status = 'queued'
         AND job_type = 'password_reset_email'
         AND JSON_UNQUOTE(JSON_EXTRACT(payload, '$.recipient')) NOT LIKE 'conc-%@example.com'
         AND JSON_UNQUOTE(JSON_EXTRACT(payload, '$.recipient')) NOT LIKE 'claim-test-%@example.com'
         AND JSON_UNQUOTE(JSON_EXTRACT(payload, '$.recipient')) NOT LIKE 'worker-conc-%@example.com'`,
    );
  } catch {
    // Best-effort queue reset between parallel integration tests.
  }

  const entries = [...cleanupEntries].reverse();
  cleanupEntries.length = 0;

  for (const entry of entries) {
    try {
      switch (entry.kind) {
        case 'payment_intent':
          await pool.query('DELETE FROM payment_timeline_events WHERE payment_intent_id = ?', [entry.id]);
          await pool.query('DELETE FROM payment_webhook_deliveries WHERE payment_intent_id = ?', [entry.id]);
          await pool.query('DELETE FROM payment_intents WHERE id = ?', [entry.id]);
          break;
        case 'merchant':
          await pool.query('UPDATE merchants SET deleted_at = NOW() WHERE id = ?', [entry.id]);
          break;
        case 'user':
          await pool.query('DELETE FROM user_roles WHERE user_id = ?', [entry.id]);
          await pool.query('DELETE FROM organization_members WHERE user_id = ?', [entry.id]);
          await pool.query('DELETE FROM users WHERE id = ?', [entry.id]);
          break;
        case 'user_email':
          await pool.query('DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email = ?)', [entry.email]);
          await pool.query('DELETE FROM organization_members WHERE user_id IN (SELECT id FROM users WHERE email = ?)', [entry.email]);
          await pool.query('DELETE FROM users WHERE email = ?', [entry.email]);
          break;
        case 'background_job':
          await pool.query('DELETE FROM background_jobs WHERE id = ?', [entry.id]);
          break;
        case 'webhook_delivery':
          await pool.query('DELETE FROM webhook_replay_history WHERE delivery_id = ?', [entry.id]);
          await pool.query('DELETE FROM webhook_delivery_queue WHERE id = ?', [entry.id]);
          break;
        case 'webhook':
          await pool.query('DELETE FROM webhook_event_subscriptions WHERE webhook_id = ?', [entry.id]);
          await pool.query('UPDATE merchant_webhooks SET deleted_at = NOW() WHERE id = ?', [entry.id]);
          break;
        case 'checkout_session':
          await pool.query('DELETE FROM checkout_session_events WHERE checkout_session_id = ?', [entry.id]);
          await pool.query('DELETE FROM checkout_sessions WHERE id = ?', [entry.id]);
          break;
        case 'retry_queue':
          await pool.query('DELETE FROM retry_queue WHERE id = ?', [entry.id]);
          break;
        case 'notification':
          await pool.query('DELETE FROM notification_deliveries WHERE notification_id = ?', [entry.id]);
          await pool.query('DELETE FROM notifications WHERE id = ?', [entry.id]);
          break;
      }
    } catch {
      // Best-effort cleanup; next test must not depend on prior state.
    }
  }
}

/** Run callback inside a DB transaction that is always rolled back (direct SQL tests). */
export async function withRollbackTransaction<T>(
  fn: (conn: PoolConnection) => Promise<T>,
  pool: Pool = getPool(),
): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.rollback();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function countTimelineEvents(paymentIntentId: number, eventType?: string): Promise<number> {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    eventType
      ? 'SELECT COUNT(*) AS cnt FROM payment_timeline_events WHERE payment_intent_id = ? AND event_type = ?'
      : 'SELECT COUNT(*) AS cnt FROM payment_timeline_events WHERE payment_intent_id = ?',
    eventType ? [paymentIntentId, eventType] : [paymentIntentId],
  );
  return Number(rows[0]?.cnt ?? 0);
}

export async function getPaymentIntentStatus(id: number): Promise<string | null> {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT status FROM payment_intents WHERE id = ?',
    [id],
  );
  return rows[0]?.status ? String(rows[0].status) : null;
}
