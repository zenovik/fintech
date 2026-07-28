import './integration-env.setup';
import test from 'node:test';
import assert from 'node:assert/strict';
import { registerIntegrationBootstrap, getIntegrationBaseUrl } from './helpers/bootstrap';
import { stubFetchSuccess, stubFetchFailure } from './helpers/harness-mocks';
import { createClient } from './helpers/client';
import { loginAdmin } from './helpers/auth';
import { CUSTOMER, MERCHANT, ORG, uniqueRef } from './helpers/fixtures';
import { queryOne } from './helpers/db';
import type { RowDataPacket } from 'mysql2/promise';

registerIntegrationBootstrap();

async function createCapturedPayment(client: ReturnType<typeof createClient>): Promise<{ paymentId: number; transactionId: number }> {
  const pay = await client.post('/api/v1/payments', {
    merchantId: MERCHANT.org1Active,
    amount: 120,
    currency: 'USD',
    merchantOrderId: uniqueRef('CB'),
    customerId: CUSTOMER.org1,
  }, ORG.merchantPro);
  const paymentId = pay.body.data?.intent?.id ?? pay.body.data?.id;
  await client.post(`/api/v1/payments/${paymentId}/authorize`, {}, ORG.merchantPro);
  const captured = await client.post(`/api/v1/payments/${paymentId}/capture`, {}, ORG.merchantPro);
  const transactionId = captured.body.data?.transactionId ?? captured.body.data?.intent?.transactionId;
  const row = await queryOne<RowDataPacket>(
    'SELECT transaction_id FROM payment_intents WHERE id = ?',
    [paymentId],
  );
  return { paymentId, transactionId: Number(transactionId ?? row?.transaction_id) };
}

test('chargebacks: create chargeback', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const { transactionId } = await createCapturedPayment(client);
  assert.ok(transactionId);
  const res = await client.post('/api/v1/chargebacks', {
    transactionId,
    reason: 'Integration test chargeback',
    reasonCode: 'fraud',
  }, ORG.merchantPro);
  assert.equal(res.status, 201);
  assert.ok(res.body.data?.id);
});

test('chargebacks: status transition via resolve', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const { transactionId } = await createCapturedPayment(client);
  const created = await client.post('/api/v1/chargebacks', {
    transactionId,
    reason: 'Dispute test',
  }, ORG.merchantPro);
  const id = created.body.data?.id;
  const resolved = await client.post(`/api/v1/chargebacks/${id}/resolve`, {
    outcome: 'merchant_won',
    notes: 'Evidence submitted',
  }, ORG.merchantPro);
  assert.equal(resolved.status, 200);
});

test('refunds: full refund via payments API', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const { paymentId } = await createCapturedPayment(client);
  const res = await client.post(`/api/v1/payments/${paymentId}/refund`, { reason: 'Full refund' }, ORG.merchantPro);
  assert.equal(res.status, 200);
});

test('refunds: partial refund module create', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const { transactionId } = await createCapturedPayment(client);
  const res = await client.post('/api/v1/refunds', {
    transactionId,
    amount: 40,
    reason: 'Partial refund test',
  }, ORG.merchantPro);
  assert.equal(res.status, 201);
  assert.ok(res.body.data?.id);
});

test('refunds: approve pending refund', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const { transactionId } = await createCapturedPayment(client);
  const created = await client.post('/api/v1/refunds', {
    transactionId,
    amount: 30,
    reason: 'Approval test',
  }, ORG.merchantPro);
  const id = created.body.data?.id;
  const approved = await client.post(`/api/v1/refunds/${id}/approve`, {}, ORG.merchantPro);
  assert.ok([200, 201].includes(approved.status));
});
