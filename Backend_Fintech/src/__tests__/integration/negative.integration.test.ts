import './integration-env.setup';
import test from 'node:test';
import assert from 'node:assert/strict';
import { registerIntegrationBootstrap, getIntegrationBaseUrl } from './helpers/bootstrap';
import { createClient } from './helpers/client';
import { loginAdmin } from './helpers/auth';
import { MERCHANT, ORG, uniqueRef } from './helpers/fixtures';
import { trackPaymentIntent } from './helpers/isolation';
import { queryOne } from './helpers/db';
import type { RowDataPacket } from 'mysql2/promise';

registerIntegrationBootstrap();

test('negative: unauthorized without token', async () => {
  const client = createClient(getIntegrationBaseUrl());
  const res = await client.get('/api/v1/merchants', ORG.merchantPro);
  assert.equal(res.status, 401);
});

test('negative: forbidden cross-tenant merchant', async () => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client, ORG.merchantPro);
  const res = await client.get(`/api/v1/merchants/${MERCHANT.org2Active}`, ORG.merchantPro);
  assert.ok([403, 404].includes(res.status));
});

test('negative: invalid payment id', async () => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const res = await client.get('/api/v1/payments/999999999', ORG.merchantPro);
  assert.equal(res.status, 404);
});

test('negative: invalid tenant organization', async () => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const res = await client.get('/api/v1/merchants', 888888);
  assert.equal(res.status, 403);
});

test('negative: expired refresh token rejected', async () => {
  const client = createClient(getIntegrationBaseUrl());
  const res = await client.post('/api/auth/refresh-token', { refreshToken: 'invalid-expired-token' });
  assert.ok([401, 403, 410].includes(res.status));
});

test('negative: invalid payload on merchant create', async () => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const res = await client.post('/api/v1/merchants', { displayName: 'missing fields' }, ORG.merchantPro);
  assert.ok([400, 422].includes(res.status));
});

test('negative: duplicate merchant order id rejected with 409', async () => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const orderId = uniqueRef('DUP');
  const body = {
    merchantId: MERCHANT.org1Active,
    amount: 50,
    merchantOrderId: orderId,
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

test('negative: replay reset token fails', async () => {
  const client = createClient(getIntegrationBaseUrl());
  const res = await client.post('/api/auth/reset-password', {
    token: 'already-used-or-invalid',
    newPassword: 'NewPassword123!',
    confirmPassword: 'NewPassword123!',
  });
  assert.ok([400, 410, 422].includes(res.status));
});

test('negative: invalid checkout session', async () => {
  const client = createClient(getIntegrationBaseUrl());
  const res = await client.post('/api/v1/public/checkout/bad-ref/pay', {
    paymentMethodCode: 'credit_card',
  }, null);
  assert.ok([400, 404, 422].includes(res.status));
});
