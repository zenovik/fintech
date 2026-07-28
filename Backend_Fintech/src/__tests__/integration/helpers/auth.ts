import { randomUUID } from 'node:crypto';
import type { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getPool } from '../../../app/database/connection';
import { sha256 } from '../../../app/shared/helpers/crypto.helper';
import { PasswordResetRepository } from '../../../app/modules/auth/repositories/password-reset.repository';
import type { ApiClient } from './client';
import { SEED_PASSWORD, USERS } from './fixtures';

interface LoginData {
  accessToken: string;
  refreshToken?: string;
  user?: { id: number; email: string };
}

export async function loginAs(
  client: ApiClient,
  email: string,
  password = SEED_PASSWORD,
  orgId?: number,
): Promise<LoginData> {
  const res = await client.post<LoginData>('/api/auth/login', {
    email,
    password,
    rememberDevice: false,
  });
  if (res.status !== 200 || !res.body.success || !res.body.data?.accessToken) {
    throw new Error(`Login failed for ${email}: ${res.status} ${res.body.message ?? ''}`);
  }
  client.setAccessToken(res.body.data.accessToken);
  if (orgId != null) client.setOrganizationId(orgId);
  return res.body.data;
}

export async function loginAdmin(client: ApiClient, orgId = USERS.admin.orgId): Promise<LoginData> {
  return loginAs(client, USERS.admin.email, SEED_PASSWORD, orgId);
}

export async function loginFinance(client: ApiClient, orgId = USERS.finance.orgId): Promise<LoginData> {
  return loginAs(client, USERS.finance.email, SEED_PASSWORD, orgId);
}

export async function loginReadOnly(client: ApiClient, orgId = USERS.readOnly.orgId): Promise<LoginData> {
  return loginAs(client, USERS.readOnly.email, SEED_PASSWORD, orgId);
}

export async function insertPasswordResetToken(
  userId: number,
  rawToken: string,
  pool: Pool = getPool(),
): Promise<void> {
  const repo = new PasswordResetRepository(pool);
  await repo.create({
    userId,
    tokenHash: sha256(rawToken),
    expiresInMinutes: 60,
    requestedIp: '127.0.0.1',
  });
}

export async function getUserIdByEmail(email: string, pool: Pool = getPool()): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    [email],
  );
  if (!rows[0]) throw new Error(`User not found: ${email}`);
  return Number(rows[0].id);
}

export async function enqueueBackgroundJob(
  jobType: string,
  payload: Record<string, unknown>,
  pool: Pool = getPool(),
): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO background_jobs (uuid, job_type, payload, status, organization_id)
     VALUES (?, ?, ?, 'queued', ?)`,
    [randomUUID(), jobType, JSON.stringify(payload), payload.organizationId ?? 1],
  );
  return result.insertId;
}

export async function insertWebhookDelivery(
  webhookId: number,
  pool: Pool = getPool(),
): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO webhook_delivery_queue
       (uuid, webhook_id, merchant_id, event_type, payload, status, attempt_count, max_attempts)
     SELECT ?, w.id, w.merchant_id, 'payment.created', '{}', 'pending', 0, 5
     FROM merchant_webhooks w WHERE w.id = ? LIMIT 1`,
    [randomUUID(), webhookId],
  );
  return result.insertId;
}

export async function cleanupPaymentIntent(paymentId: number, pool: Pool = getPool()): Promise<void> {
  await pool.query('DELETE FROM payment_intent_timeline WHERE payment_intent_id = ?', [paymentId]);
  await pool.query('DELETE FROM payment_webhook_deliveries WHERE payment_intent_id = ?', [paymentId]);
  await pool.query('DELETE FROM payment_intents WHERE id = ?', [paymentId]);
}

export async function cleanupMerchant(merchantId: number, pool: Pool = getPool()): Promise<void> {
  await pool.query('UPDATE merchants SET deleted_at = NOW() WHERE id = ?', [merchantId]);
}
