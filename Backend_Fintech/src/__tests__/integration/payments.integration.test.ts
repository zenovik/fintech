import './integration-env.setup';
import test from 'node:test';
import assert from 'node:assert/strict';
import { registerIntegrationBootstrap, getIntegrationBaseUrl } from './helpers/bootstrap';
import { stubFetchSuccess, stubFetchFailure } from './helpers/harness-mocks';
import { createClient } from './helpers/client';
import { loginAdmin } from './helpers/auth';
import { CUSTOMER, MERCHANT, ORG, uniqueRef } from './helpers/fixtures';

registerIntegrationBootstrap();

async function createPayment(client: ReturnType<typeof createClient>, amount = 100): Promise<number> {
  const res = await client.post('/api/v1/payments', {
    merchantId: MERCHANT.org1Active,
    amount,
    currency: 'USD',
    merchantOrderId: uniqueRef('PAY'),
    customerId: CUSTOMER.org1,
  }, ORG.merchantPro);
  assert.equal(res.status, 201);
  return res.body.data?.intent?.id ?? res.body.data?.id;
}

test('payments: create payment', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const id = await createPayment(client);
  assert.ok(id);
});

test('payments: authorize payment', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const id = await createPayment(client);
  const res = await client.post(`/api/v1/payments/${id}/authorize`, {}, ORG.merchantPro);
  assert.equal(res.status, 200);
  assert.equal(res.body.data?.intent?.status ?? res.body.data?.status, 'authorized');
});

test('payments: capture payment', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const id = await createPayment(client, 200);
  await client.post(`/api/v1/payments/${id}/authorize`, {}, ORG.merchantPro);
  const res = await client.post(`/api/v1/payments/${id}/capture`, {}, ORG.merchantPro);
  assert.equal(res.status, 200);
  assert.equal(res.body.data?.intent?.status ?? res.body.data?.status, 'captured');
});

test('payments: partial capture', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const id = await createPayment(client, 300);
  await client.post(`/api/v1/payments/${id}/authorize`, {}, ORG.merchantPro);
  const res = await client.post(`/api/v1/payments/${id}/capture`, { amount: 100 }, ORG.merchantPro);
  assert.equal(res.status, 200);
  const captured = Number(res.body.data?.intent?.amountCaptured ?? res.body.data?.amountCaptured ?? 0);
  assert.equal(captured, 100);
});

test('payments: cancel payment', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const id = await createPayment(client);
  const res = await client.post(`/api/v1/payments/${id}/cancel`, { reason: 'Test cancel' }, ORG.merchantPro);
  assert.equal(res.status, 200);
  assert.equal(res.body.data?.intent?.status ?? res.body.data?.status, 'cancelled');
});

test('payments: refund captured payment', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const id = await createPayment(client, 150);
  await client.post(`/api/v1/payments/${id}/authorize`, {}, ORG.merchantPro);
  await client.post(`/api/v1/payments/${id}/capture`, {}, ORG.merchantPro);
  const res = await client.post(`/api/v1/payments/${id}/refund`, { amount: 50, reason: 'Test refund' }, ORG.merchantPro);
  assert.equal(res.status, 200);
  const refunded = Number(res.body.data?.intent?.amountRefunded ?? res.body.data?.amountRefunded ?? 0);
  assert.ok(refunded >= 50);
});

test('payments: expire pending payment', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const id = await createPayment(client);
  const res = await client.post(`/api/v1/payments/${id}/expire`, {}, ORG.merchantPro);
  assert.equal(res.status, 200);
  assert.equal(res.body.data?.intent?.status ?? res.body.data?.status, 'expired');
});

test('payments: get payment timeline', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const id = await createPayment(client);
  await client.post(`/api/v1/payments/${id}/authorize`, {}, ORG.merchantPro);
  const timeline = await client.get(`/api/v1/payments/${id}/timeline`, ORG.merchantPro);
  assert.equal(timeline.status, 200);
  assert.ok(Array.isArray(timeline.body.data?.events ?? timeline.body.data));
});
