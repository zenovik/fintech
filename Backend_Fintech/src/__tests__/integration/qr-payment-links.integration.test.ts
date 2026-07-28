import './integration-env.setup';
import test from 'node:test';
import assert from 'node:assert/strict';
import { registerIntegrationBootstrap, getIntegrationBaseUrl } from './helpers/bootstrap';
import { stubFetchSuccess, stubFetchFailure } from './helpers/harness-mocks';
import { createClient } from './helpers/client';
import { loginAdmin } from './helpers/auth';
import { MERCHANT, ORG, uniqueRef } from './helpers/fixtures';

registerIntegrationBootstrap();

test('qr: create QR payment', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const res = await client.post('/api/v1/qr-payments', {
    merchantId: MERCHANT.org1Active,
    title: uniqueRef('QR'),
    amount: 25,
    currency: 'USD',
    qrType: 'static',
  }, ORG.merchantPro);
  assert.equal(res.status, 201);
  assert.ok(res.body.data?.id);
  assert.ok(res.body.data?.publicToken ?? res.body.data?.token);
});

test('qr: expire via disable', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const created = await client.post('/api/v1/qr-payments', {
    merchantId: MERCHANT.org1Active,
    title: uniqueRef('QR-EXP'),
    amount: 15,
  }, ORG.merchantPro);
  const id = created.body.data?.id;
  const disabled = await client.post(`/api/v1/qr-payments/${id}/disable`, {}, ORG.merchantPro);
  assert.equal(disabled.status, 200);
});

test('qr: public payment', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const created = await client.post('/api/v1/qr-payments', {
    merchantId: MERCHANT.org1Active,
    title: uniqueRef('QR-PAY'),
    amount: 20,
  }, ORG.merchantPro);
  const token = created.body.data?.publicToken ?? created.body.data?.token;
  assert.ok(token);
  const publicClient = createClient(getIntegrationBaseUrl());
  const pay = await publicClient.post(`/api/v1/public/qr-payments/${token}/pay`, {
    amount: 20,
    paymentMethodDetail: 'QR Test',
  }, null);
  assert.ok([200, 201].includes(pay.status));
});

test('payment-links: create link', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const res = await client.post('/api/v1/payment-links', {
    merchantId: MERCHANT.org1Active,
    title: uniqueRef('LINK'),
    amount: 45,
    currency: 'USD',
  }, ORG.merchantPro);
  assert.equal(res.status, 201);
  assert.ok(res.body.data?.publicToken ?? res.body.data?.token);
});

test('payment-links: expire link', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const created = await client.post('/api/v1/payment-links', {
    merchantId: MERCHANT.org1Active,
    title: uniqueRef('LINK-EXP'),
    amount: 30,
  }, ORG.merchantPro);
  const id = created.body.data?.id;
  const expired = await client.post(`/api/v1/payment-links/${id}/expire`, {}, ORG.merchantPro);
  assert.equal(expired.status, 200);
});

test('payment-links: successful public payment', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const created = await client.post('/api/v1/payment-links', {
    merchantId: MERCHANT.org1Active,
    title: uniqueRef('LINK-PAY'),
    amount: 35,
  }, ORG.merchantPro);
  const token = created.body.data?.publicToken ?? created.body.data?.token;
  assert.ok(token);
  const publicClient = createClient(getIntegrationBaseUrl());
  const pay = await publicClient.post(`/api/v1/public/payment-links/${token}/pay`, {
    amount: 35,
    paymentMethodDetail: 'Link Test',
  }, null);
  assert.ok([200, 201].includes(pay.status));
});
