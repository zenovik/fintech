import './integration-env.setup';
import test from 'node:test';
import assert from 'node:assert/strict';
import { registerIntegrationBootstrap, getIntegrationBaseUrl } from './helpers/bootstrap';
import { createClient } from './helpers/client';
import { loginAdmin } from './helpers/auth';
import { MERCHANT, ORG, PAYMENT_METHOD, uniqueRef } from './helpers/fixtures';
import { getDbPool, queryOne } from './helpers/db';
import { trackCheckoutSession } from './helpers/isolation';
import type { RowDataPacket } from 'mysql2/promise';

registerIntegrationBootstrap();

test('checkout: session creation', async () => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const res = await client.post('/api/v1/checkout/sessions', {
    merchantId: MERCHANT.org1Active,
    amount: 99.99,
    currency: 'USD',
    merchantOrderId: uniqueRef('CHK'),
    expiryMinutes: 30,
  }, ORG.merchantPro);
  assert.equal(res.status, 201);
  const sessionId = res.body.data?.checkoutSessionId ?? res.body.data?.id;
  assert.ok(res.body.data?.checkoutRef ?? res.body.data?.checkoutSessionId);
  if (sessionId) trackCheckoutSession(sessionId);
});

test('checkout: successful public payment', async () => {
  const admin = createClient(getIntegrationBaseUrl());
  await loginAdmin(admin);
  const created = await admin.post('/api/v1/checkout/sessions', {
    merchantId: MERCHANT.org1Active,
    amount: 55,
    currency: 'USD',
    merchantOrderId: uniqueRef('CHK-PAY'),
  }, ORG.merchantPro);
  const ref = created.body.data?.checkoutRef;
  const secret = created.body.data?.clientSecret;
  const sessionId = created.body.data?.checkoutSessionId ?? created.body.data?.id;
  assert.ok(ref && secret);
  if (sessionId) trackCheckoutSession(sessionId);

  const publicClient = createClient(getIntegrationBaseUrl());
  const pay = await publicClient.post(`/api/v1/public/checkout/${ref}/pay?client_secret=${encodeURIComponent(secret)}`, {
    paymentMethodCode: PAYMENT_METHOD,
    amount: 55,
  }, null);
  assert.equal(pay.status, 200);
  assert.equal(pay.body.data?.status, 'success');

  const row = await queryOne<RowDataPacket>(
    'SELECT status FROM checkout_sessions WHERE checkout_ref = ?',
    [ref],
  );
  assert.equal(row?.status, 'complete');
});

test('checkout: invalid session returns error', async () => {
  const client = createClient(getIntegrationBaseUrl());
  const res = await client.get('/api/v1/public/checkout/invalid-ref-000?client_secret=badsecret', null);
  assert.ok([400, 404, 422].includes(res.status));
});

test('checkout: expired session rejects payment', async () => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const created = await client.post('/api/v1/checkout/sessions', {
    merchantId: MERCHANT.org1Active,
    amount: 10,
    merchantOrderId: uniqueRef('CHK-EXP'),
    expiryMinutes: 30,
  }, ORG.merchantPro);
  const ref = created.body.data?.checkoutRef;
  const secret = created.body.data?.clientSecret;
  const sessionId = created.body.data?.checkoutSessionId ?? created.body.data?.id;
  assert.ok(ref && secret && sessionId);
  trackCheckoutSession(sessionId);

  await getDbPool().query(
    `UPDATE checkout_sessions SET expires_at = DATE_SUB(NOW(), INTERVAL 5 MINUTE) WHERE id = ?`,
    [sessionId],
  );

  const publicClient = createClient(getIntegrationBaseUrl());
  const pay = await publicClient.post(`/api/v1/public/checkout/${ref}/pay?client_secret=${encodeURIComponent(secret)}`, {
    paymentMethodCode: PAYMENT_METHOD,
    amount: 10,
  }, null);
  assert.ok([400, 422].includes(pay.status));
  assert.match(String(pay.body.message ?? ''), /expired/i);

  const row = await queryOne<RowDataPacket>(
    'SELECT status FROM checkout_sessions WHERE id = ?',
    [sessionId],
  );
  assert.equal(row?.status, 'expired');
});
