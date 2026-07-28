import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { randomUUID } from 'node:crypto';
import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../database';
import { resolveSecret } from '../crypto/secret-crypto';
import { recordMetric } from '../observability/metrics.registry';
import { logger } from '../logger';
import { computeBackoffSeconds } from '../webhooks/webhook-delivery.engine';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  organizationId?: number;
  jobId?: number;
  templateType?: string;
  correlationId?: string;
}

interface SmtpConfig {
  host: string;
  port: number;
  username: string | null;
  password: string | null;
  fromEmail: string;
  fromName: string | null;
  useTls: boolean;
}

export class EmailService {
  private transporterCache: { configHash: string; transporter: Transporter } | null = null;

  constructor(private readonly pool: Pool = getPool()) {}

  async loadSmtpConfig(): Promise<SmtpConfig | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT host, port, username, password_encrypted_v2, password_encrypted, from_email, from_name, use_tls
       FROM smtp_settings WHERE id = 1 LIMIT 1`,
    );
    const row = rows[0];
    if (!row?.host) return null;
    const password = resolveSecret(row.password_encrypted_v2 as string | null, true)
      ?? resolveSecret(row.password_encrypted as string | null, true);
    return {
      host: String(row.host),
      port: Number(row.port ?? 587),
      username: row.username ? String(row.username) : null,
      password,
      fromEmail: String(row.from_email ?? 'noreply@localhost'),
      fromName: row.from_name ? String(row.from_name) : null,
      useTls: Boolean(row.use_tls),
    };
  }

  private async getTransporter(config: SmtpConfig): Promise<Transporter> {
    const configHash = `${config.host}:${config.port}:${config.username}:${config.useTls}`;
    if (this.transporterCache?.configHash === configHash) {
      return this.transporterCache.transporter;
    }
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      requireTLS: config.useTls && config.port !== 465,
      auth: config.username && config.password
        ? { user: config.username, pass: config.password }
        : undefined,
      pool: true,
      maxConnections: 3,
    });
    this.transporterCache = { configHash, transporter };
    return transporter;
  }

  async createDeliveryLog(input: SendEmailInput): Promise<number> {
    const uuid = randomUUID();
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO email_delivery_log (uuid, organization_id, job_id, recipient, subject, template_type, status, correlation_id)
       VALUES (?, ?, ?, ?, ?, ?, 'queued', ?)`,
      [uuid, input.organizationId ?? null, input.jobId ?? null, input.to, input.subject,
        input.templateType ?? null, input.correlationId ?? randomUUID()],
    );
    return result.insertId;
  }

  async sendEmail(input: SendEmailInput): Promise<{ success: boolean; error?: string; logId?: number }> {
    const started = Date.now();
    const logId = await this.createDeliveryLog(input);
    const config = await this.loadSmtpConfig();
    if (!config) {
      await this.markFailed(logId, 'SMTP not configured', 0);
      recordMetric('email.delivery', false, Date.now() - started, 'smtp_not_configured');
      return { success: false, error: 'SMTP not configured', logId };
    }

    try {
      const transporter = await this.getTransporter(config);
      const from = config.fromName ? `"${config.fromName}" <${config.fromEmail}>` : config.fromEmail;
      await transporter.sendMail({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text ?? input.html.replace(/<[^>]+>/g, ''),
        headers: {
          'X-Correlation-Id': input.correlationId ?? randomUUID(),
        },
      });
      await this.pool.query(
        `UPDATE email_delivery_log SET status = 'sent', sent_at = NOW(), attempt_count = attempt_count + 1 WHERE id = ?`,
        [logId],
      );
      const durationMs = Date.now() - started;
      recordMetric('email.delivery', true, durationMs);
      logger.info('Email sent', { logId, to: input.to, subject: input.subject, durationMs, correlationId: input.correlationId });
      return { success: true, logId };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.markFailed(logId, message, 1);
      recordMetric('email.delivery', false, Date.now() - started, 'smtp_error');
      logger.warn('Email send failed', { logId, to: input.to, error: message });
      return { success: false, error: message, logId };
    }
  }

  async retryFailedEmails(limit: number): Promise<number> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT * FROM email_delivery_log WHERE status = 'failed' AND attempt_count < 5 ORDER BY created_at ASC LIMIT ?`,
      [limit],
    );
    let retried = 0;
    for (const row of rows) {
      const result = await this.sendEmail({
        to: String(row.recipient),
        subject: String(row.subject),
        html: `<p>Retry delivery for: ${row.subject}</p>`,
        organizationId: row.organization_id ? Number(row.organization_id) : undefined,
        jobId: row.job_id ? Number(row.job_id) : undefined,
        templateType: row.template_type ? String(row.template_type) : undefined,
        correlationId: row.correlation_id ? String(row.correlation_id) : undefined,
      });
      if (result.success) retried += 1;
      else {
        const attempt = Number(row.attempt_count) + 1;
        if (attempt >= 5) {
          await this.pool.query(`UPDATE email_delivery_log SET status = 'dead_letter' WHERE id = ?`, [row.id]);
        } else {
          const delaySec = computeBackoffSeconds(attempt);
          await this.pool.query(
            `UPDATE email_delivery_log SET attempt_count = ?, last_error = ? WHERE id = ?`,
            [attempt, result.error?.slice(0, 500), row.id],
          );
          void delaySec;
        }
      }
    }
    return retried;
  }

  private async markFailed(logId: number, error: string, attempt: number): Promise<void> {
    await this.pool.query(
      `UPDATE email_delivery_log SET status = 'failed', last_error = ?, attempt_count = ? WHERE id = ?`,
      [error.slice(0, 500), attempt, logId],
    );
  }
}

export const emailService = new EmailService();
