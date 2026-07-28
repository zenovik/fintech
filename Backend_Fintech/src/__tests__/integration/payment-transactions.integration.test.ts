import './integration-env.setup';
import test from 'node:test';
import assert from 'node:assert/strict';
import { registerIntegrationBootstrap, getIntegrationBaseUrl } from './helpers/bootstrap';
import { createClient } from './helpers/client';
import { loginAdmin } from './helpers/auth';
import { CUSTOMER, MERCHANT, ORG, uniqueRef } from './helpers/fixtures';
import {
  countTimelineEvents,
  getPaymentIntentStatus,
  trackPaymentIntent,
  withRollbackTransaction,
} from './helpers/isolation';
import { queryOne } from './helpers/db';
import type { RowDataPacket } from 'mysql2/promise';

registerIntegrationBootstrap();

test('payment transactions: duplicate authorize rolls back with no extra timeline events', async () => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const created = await client.post('/api/v1/payments', {
    merchantId: MERCHANT.org1Active,
    amount: 88,
    currency: 'USD',
    merchantOrderId: uniqueRef('TXN-AUTH'),
    customerId: CUSTOMER.org1,
  }, ORG.merchantPro);
  assert.equal(created.status, 201);
  const id = created.body.data?.intent?.id;
  assert.ok(id);
  trackPaymentIntent(id);

  const first = await client.post(`/api/v1/payments/${id}/authorize`, {}, ORG.merchantPro);
  assert.equal(first.status, 200);
  assert.equal(first.body.data?.intent?.status, 'authorized');

  const second = await client.post(`/api/v1/payments/${id}/authorize`, {}, ORG.merchantPro);
  assert.ok([400, 422].includes(second.status), `expected validation failure, got ${second.status}`);

  assert.equal(await getPaymentIntentStatus(id), 'authorized');
  assert.equal(await countTimelineEvents(id, 'authorized'), 1);

  const row = await queryOne<RowDataPacket>(
    'SELECT authorized_at, acquirer_reference FROM payment_intents WHERE id = ?',
    [id],
  );
  assert.ok(row?.authorized_at);
  assert.ok(row?.acquirer_reference);
});

test('payment transactions: failed capture on already-captured payment leaves single capture', async () => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const created = await client.post('/api/v1/payments', {
    merchantId: MERCHANT.org1Active,
    amount: 60,
    merchantOrderId: uniqueRef('TXN-CAP'),
  }, ORG.merchantPro);
  const id = created.body.data?.intent?.id;
  trackPaymentIntent(id);
  await client.post(`/api/v1/payments/${id}/authorize`, {}, ORG.merchantPro);
  const cap1 = await client.post(`/api/v1/payments/${id}/capture`, {}, ORG.merchantPro);
  assert.equal(cap1.status, 200);

  const cap2 = await client.post(`/api/v1/payments/${id}/capture`, {}, ORG.merchantPro);
  assert.ok([400, 422].includes(cap2.status));

  const row = await queryOne<RowDataPacket>(
    'SELECT status, amount_captured FROM payment_intents WHERE id = ?',
    [id],
  );
  assert.equal(row?.status, 'captured');
  assert.equal(Number(row?.amount_captured), 60);
});

test('payment transactions: direct SQL rollback does not persist rows', async () => {
  const marker = uniqueRef('SQL-RB');
  await withRollbackTransaction(async (conn) => {
    await conn.query(
      `INSERT INTO background_jobs (uuid, job_type, payload, status) VALUES (UUID(), 'integration_probe', ?, 'queued')`,
      [JSON.stringify({ marker })],
    );
  });
  const row = await queryOne<RowDataPacket>(
    `SELECT id FROM background_jobs WHERE job_type = 'integration_probe' AND JSON_EXTRACT(payload, '$.marker') = ?`,
    [marker],
  );
  assert.equal(row, null);
});

test('payment transactions: duplicate merchant order returns 409 DUPLICATE', async () => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const orderId = uniqueRef('DUP-TXN');
  const body = {
    merchantId: MERCHANT.org1Active,
    amount: 42,
    merchantOrderId: orderId,
    customerId: CUSTOMER.org1,
  };
  const first = await client.post('/api/v1/payments', body, ORG.merchantPro);
  assert.equal(first.status, 201);
  trackPaymentIntent(first.body.data?.intent?.id);

  const second = await client.post('/api/v1/payments', body, ORG.merchantPro);
  assert.equal(second.status, 409);
  assert.equal(second.body.code, 'DUPLICATE');

  const count = await queryOne<RowDataPacket>(
    'SELECT COUNT(*) AS cnt FROM payment_orders WHERE merchant_id = ? AND merchant_order_id = ?',
    [MERCHANT.org1Active, orderId],
  );
  assert.equal(Number(count?.cnt), 1);
});
