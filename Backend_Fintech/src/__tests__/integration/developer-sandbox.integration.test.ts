import './integration-env.setup';
import test from 'node:test';
import assert from 'node:assert/strict';
import { registerIntegrationBootstrap, getIntegrationBaseUrl } from './helpers/bootstrap';
import { stubFetchSuccess, stubFetchFailure } from './helpers/harness-mocks';
import { createClient } from './helpers/client';
import { loginAdmin } from './helpers/auth';
import { MERCHANT, ORG, uniqueRef } from './helpers/fixtures';

registerIntegrationBootstrap();

test('developer: list API keys', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const res = await client.get('/api/v1/developer/api-keys', ORG.merchantPro);
  assert.equal(res.status, 200);
});

test('developer: create API key via organizations endpoint', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const res = await client.post(`/api/v1/organizations/${ORG.merchantPro}/api-keys`, {
    name: uniqueRef('API-KEY'),
    environment: 'test',
  }, ORG.merchantPro);
  assert.equal(res.status, 201);
  assert.ok(res.body.data?.id ?? res.body.data?.keyPrefix);
});

test('developer: revoke API key', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const created = await client.post(`/api/v1/organizations/${ORG.merchantPro}/api-keys`, {
    name: uniqueRef('REVOKE-KEY'),
    environment: 'test',
  }, ORG.merchantPro);
  const keyId = created.body.data?.id;
  const revoked = await client.delete(`/api/v1/organizations/${ORG.merchantPro}/api-keys/${keyId}`, ORG.merchantPro);
  assert.equal(revoked.status, 200);
});

test('sandbox: dashboard and test payment simulation', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const dash = await client.get('/api/v1/sandbox/dashboard', ORG.merchantPro);
  assert.equal(dash.status, 200);
  const simulation = await client.post('/api/v1/sandbox/simulations', {
    simulationType: 'payment_success',
    configJson: { merchantId: MERCHANT.org1Active, amount: 10 },
    isEnabled: true,
  }, ORG.merchantPro);
  assert.equal(simulation.status, 201);
  const cards = await client.get('/api/v1/sandbox/test-cards', ORG.merchantPro);
  assert.equal(cards.status, 200);
});

test('sandbox: create sandbox account', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const res = await client.post('/api/v1/sandbox/accounts', {
    merchantId: MERCHANT.org1Active,
    accountName: uniqueRef('SBX'),
  }, ORG.merchantPro);
  assert.equal(res.status, 201);
});
