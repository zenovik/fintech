import { Pool, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../database';
import { auditRecorder } from '../../modules/audit';
import { emailService } from '../email/email.service';
import { webhookDeliveryProcessor } from '../webhooks/webhook-delivery.engine';
import { recordMetric } from '../observability/metrics.registry';
import { logger } from '../logger';

export interface JobProcessResult {
  success: boolean;
  error?: string;
}

function serializeJsonColumnValue(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  if (Buffer.isBuffer(value)) return value.toString('utf8');
  return JSON.stringify(value);
}

export async function processBackgroundJob(
  jobId: number,
  pool: Pool = getPool(),
): Promise<JobProcessResult> {
  const started = Date.now();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM background_jobs WHERE id = ? AND status IN ('queued','running') LIMIT 1`,
    [jobId],
  );
  const job = rows[0];
  if (!job) return { success: false, error: 'Job not found' };

  await pool.query(
    `UPDATE background_jobs SET status = 'running', started_at = COALESCE(started_at, NOW()) WHERE id = ?`,
    [jobId],
  );

  const payload = job.payload
    ? (typeof job.payload === 'string' ? JSON.parse(job.payload) : job.payload) as Record<string, unknown>
    : {};

  try {
    switch (String(job.job_type)) {
      case 'invoice_email':
        await handleInvoiceEmail(payload, Number(job.id), job.organization_id ? Number(job.organization_id) : undefined);
        break;
      case 'webhook_delivery':
        if (payload.deliveryId) {
          await webhookDeliveryProcessor.processQueueDelivery(Number(payload.deliveryId));
        } else if (payload.paymentDeliveryId) {
          await webhookDeliveryProcessor.processPaymentWebhookDelivery(Number(payload.paymentDeliveryId));
        }
        break;
      case 'notification_email':
        await handleNotificationEmail(payload);
        break;
      case 'password_reset_email':
        await handlePasswordResetEmail(
          payload,
          Number(job.id),
          job.organization_id ? Number(job.organization_id) : undefined,
        );
        break;
      default: {
        const jobType = String(job.job_type);
        logger.warn('Unknown background job type', { jobId, jobType });
        void auditRecorder.record({
          module: 'system',
          categoryCode: 'operations',
          actionCode: 'unknown_job_type',
          entityType: 'background_job',
          entityId: String(jobId),
          description: `Unknown background job type: ${jobType}`,
          riskLevel: 'high',
          metadata: { jobType },
        }).catch(() => {});
        throw new Error(`Unknown background job type: ${jobType}`);
      }
    }

    await pool.query(
      `UPDATE background_jobs SET status = 'completed', completed_at = NOW(), error_message = NULL WHERE id = ?`,
      [jobId],
    );
    recordMetric(`job.${job.job_type}`, true, Date.now() - started);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await pool.query(
      `UPDATE background_jobs SET status = 'failed', error_message = ?, completed_at = NOW() WHERE id = ?`,
      [message.slice(0, 2000), jobId],
    );
    recordMetric(`job.${job.job_type}`, false, Date.now() - started, message.slice(0, 64));
    return { success: false, error: message };
  }
}

async function handleInvoiceEmail(
  payload: Record<string, unknown>,
  jobId: number,
  organizationId?: number,
): Promise<void> {
  const recipient = String(payload.recipient ?? '');
  const subject = String(payload.subject ?? 'Invoice');
  const message = String(payload.message ?? subject);
  const html = `<div>${message.replace(/\n/g, '<br>')}</div>`;
  const result = await emailService.sendEmail({
    to: recipient,
    subject,
    html,
    text: message,
    organizationId,
    jobId,
    templateType: 'invoice',
    correlationId: payload.correlationId ? String(payload.correlationId) : undefined,
  });
  if (!result.success) throw new Error(result.error ?? 'Invoice email failed');
}

async function handlePasswordResetEmail(
  payload: Record<string, unknown>,
  jobId: number,
  organizationId?: number,
): Promise<void> {
  const recipient = String(payload.recipient ?? '');
  const resetUrl = String(payload.resetUrl ?? '');
  if (!recipient || !resetUrl) throw new Error('Missing password reset email payload');

  const result = await emailService.sendEmail({
    to: recipient,
    subject: 'Reset your password',
    html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Reset your password</a></p><p>If you did not request this, you can ignore this email.</p>`,
    text: `Reset your password: ${resetUrl}`,
    organizationId,
    jobId,
    templateType: 'password_reset',
    correlationId: payload.correlationId ? String(payload.correlationId) : undefined,
  });
  if (!result.success) throw new Error(result.error ?? 'Password reset email failed');
}

async function handleNotificationEmail(payload: Record<string, unknown>): Promise<void> {
  const deliveryId = Number(payload.deliveryId);
  if (!deliveryId) return;
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT nd.*, n.title, n.body, u.email FROM notification_deliveries nd
     JOIN notifications n ON n.id = nd.notification_id
     JOIN users u ON u.id = nd.user_id
     WHERE nd.id = ? AND nd.channel = 'email' AND nd.status = 'pending' LIMIT 1`,
    [deliveryId],
  );
  const row = rows[0];
  if (!row?.email) return;

  const result = await emailService.sendEmail({
    to: String(row.email),
    subject: String(row.title),
    html: `<div>${String(row.body).replace(/\n/g, '<br>')}</div>`,
    templateType: 'notification',
    correlationId: String(row.uuid),
  });

  await pool.query(
    `UPDATE notification_deliveries SET status = ?, sent_at = CASE WHEN ? THEN NOW() ELSE sent_at END,
     error_message = ? WHERE id = ?`,
    [result.success ? 'sent' : 'failed', result.success ? 1 : 0, result.error?.slice(0, 512) ?? null, deliveryId],
  );
  if (!result.success) throw new Error(result.error ?? 'Notification email failed');
}

export async function processRetryQueueItem(
  itemId: number,
  pool: Pool = getPool(),
): Promise<JobProcessResult> {
  const started = Date.now();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM retry_queue WHERE id = ? AND status IN ('pending','failed','processing') LIMIT 1`,
    [itemId],
  );
  const item = rows[0];
  if (!item) return { success: false, error: 'Retry item not found' };

  if (Number(item.attempt_count) >= Number(item.max_attempts)) {
    await pool.query(`UPDATE retry_queue SET status = 'failed', last_error = 'Max attempts exceeded' WHERE id = ?`, [itemId]);
    return { success: false, error: 'Max attempts exceeded' };
  }

  if (String(item.status) !== 'processing') {
    await pool.query(
      `UPDATE retry_queue SET status = 'processing', attempt_count = attempt_count + 1 WHERE id = ?`,
      [itemId],
    );
  }

  const payload = item.payload
    ? (typeof item.payload === 'string' ? JSON.parse(item.payload) : item.payload) as Record<string, unknown>
    : {};

  try {
    const entityType = String(item.entity_type);
    const operation = String(item.operation);

    if (entityType === 'webhook_delivery' || operation === 'webhook_retry') {
      const deliveryId = Number(payload.deliveryId ?? item.entity_id);
      await webhookDeliveryProcessor.processQueueDelivery(deliveryId);
    } else if (entityType === 'payment_webhook' || operation === 'payment_webhook_retry') {
      const deliveryId = Number(payload.deliveryId ?? item.entity_id);
      await webhookDeliveryProcessor.processPaymentWebhookDelivery(deliveryId);
    } else if (entityType === 'email' || operation === 'email_retry') {
      await emailService.retryFailedEmails(1);
    } else {
      logger.info('Retry queue item processed (generic)', { itemId, entityType, operation });
    }

    await pool.query(
      `UPDATE retry_queue SET status = 'completed', processed_at = NOW(), last_error = NULL WHERE id = ?`,
      [itemId],
    );
    recordMetric('retry_queue', true, Date.now() - started);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await pool.query(
      `UPDATE retry_queue SET status = 'failed', last_error = ?, processed_at = NOW() WHERE id = ?`,
      [message.slice(0, 2000), itemId],
    );
    recordMetric('retry_queue', false, Date.now() - started, message.slice(0, 64));
    return { success: false, error: message };
  }
}

export async function processNotificationEmailDelivery(
  deliveryId: number,
  pool: Pool = getPool(),
): Promise<JobProcessResult> {
  const started = Date.now();
  try {
    await handleNotificationEmail({ deliveryId });
    recordMetric('notification.email', true, Date.now() - started);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    recordMetric('notification.email', false, Date.now() - started, message.slice(0, 64));
    return { success: false, error: message };
  }
}

export async function processScheduledTasks(pool: Pool = getPool()): Promise<number> {
  const [schedules] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM background_job_schedules WHERE is_active = 1`,
  );
  let enqueued = 0;
  for (const schedule of schedules) {
    const jobType = String(schedule.job_type);
    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM background_jobs WHERE job_type = ? AND status IN ('queued','running')
       AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE) LIMIT 1`,
      [jobType],
    );
    if (existing[0]) continue;
    await pool.query(
      `INSERT INTO background_jobs (uuid, job_type, status, payload)
       VALUES (UUID(), ?, 'queued', ?)`,
      [jobType, serializeJsonColumnValue(schedule.payload)],
    );
    enqueued += 1;
  }
  return enqueued;
}
