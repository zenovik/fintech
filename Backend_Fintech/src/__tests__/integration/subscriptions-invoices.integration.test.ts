import './integration-env.setup';
import test from 'node:test';
import assert from 'node:assert/strict';
import { registerIntegrationBootstrap, getIntegrationBaseUrl } from './helpers/bootstrap';
import { stubFetchSuccess, stubFetchFailure } from './helpers/harness-mocks';
import { createClient } from './helpers/client';
import { loginAdmin } from './helpers/auth';
import { CUSTOMER, MERCHANT, ORG, uniqueRef } from './helpers/fixtures';

registerIntegrationBootstrap();

test('subscriptions: create plan and subscription', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const plan = await client.post('/api/v1/subscriptions/plans', {
    merchantId: MERCHANT.org1Active,
    name: uniqueRef('PLAN'),
    price: 29.99,
    currency: 'USD',
    billingInterval: 'monthly',
  }, ORG.merchantPro);
  assert.equal(plan.status, 201);
  const planId = plan.body.data?.id;
  const sub = await client.post('/api/v1/subscriptions', {
    merchantId: MERCHANT.org1Active,
    customerId: CUSTOMER.org1,
    planId,
  }, ORG.merchantPro);
  assert.equal(sub.status, 201);
  assert.ok(sub.body.data?.id);
});

test('subscriptions: renewal', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const plan = await client.post('/api/v1/subscriptions/plans', {
    merchantId: MERCHANT.org1Active,
    name: uniqueRef('PLAN-R'),
    price: 19.99,
    billingInterval: 'monthly',
  }, ORG.merchantPro);
  const sub = await client.post('/api/v1/subscriptions', {
    merchantId: MERCHANT.org1Active,
    customerId: CUSTOMER.org1,
    planId: plan.body.data?.id,
  }, ORG.merchantPro);
  const subId = sub.body.data?.id;
  const renewed = await client.post(`/api/v1/subscriptions/${subId}/renew`, {}, ORG.merchantPro);
  assert.ok([200, 201].includes(renewed.status));
});

test('subscriptions: invoice generation on renew', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const plan = await client.post('/api/v1/subscriptions/plans', {
    merchantId: MERCHANT.org1Active,
    name: uniqueRef('PLAN-INV'),
    price: 49.99,
    billingInterval: 'monthly',
  }, ORG.merchantPro);
  const sub = await client.post('/api/v1/subscriptions', {
    merchantId: MERCHANT.org1Active,
    customerId: CUSTOMER.org1,
    planId: plan.body.data?.id,
  }, ORG.merchantPro);
  await client.post(`/api/v1/subscriptions/${sub.body.data?.id}/renew`, {}, ORG.merchantPro);
  const invoices = await client.get('/api/v1/invoices?page=1&pageSize=5', ORG.merchantPro);
  assert.equal(invoices.status, 200);
  assert.ok(Array.isArray(invoices.body.data?.items));
});

test('invoices: create invoice', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const today = new Date().toISOString().slice(0, 10);
  const due = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const res = await client.post('/api/v1/invoices', {
    merchantId: MERCHANT.org1Active,
    customerId: CUSTOMER.org1,
    issueDate: today,
    dueDate: due,
    currency: 'USD',
    lineItems: [{ description: 'Integration test item', quantity: 1, unitPrice: 100 }],
  }, ORG.merchantPro);
  assert.equal(res.status, 201);
  assert.ok(res.body.data?.id);
});

test('invoices: mark paid', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const today = new Date().toISOString().slice(0, 10);
  const due = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const created = await client.post('/api/v1/invoices', {
    merchantId: MERCHANT.org1Active,
    customerId: CUSTOMER.org1,
    issueDate: today,
    dueDate: due,
    lineItems: [{ description: 'Pay test', quantity: 1, unitPrice: 75 }],
  }, ORG.merchantPro);
  const id = created.body.data?.id;
  const paid = await client.post(`/api/v1/invoices/${id}/mark-paid`, { amount: 75 }, ORG.merchantPro);
  assert.equal(paid.status, 200);
});

test('invoices: cancel invoice', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const today = new Date().toISOString().slice(0, 10);
  const due = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const created = await client.post('/api/v1/invoices', {
    merchantId: MERCHANT.org1Active,
    customerId: CUSTOMER.org1,
    issueDate: today,
    dueDate: due,
    lineItems: [{ description: 'Cancel test', quantity: 1, unitPrice: 50 }],
  }, ORG.merchantPro);
  const cancelled = await client.post(`/api/v1/invoices/${created.body.data?.id}/cancel`, {}, ORG.merchantPro);
  assert.equal(cancelled.status, 200);
});
