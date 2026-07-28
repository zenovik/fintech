import './integration-env.setup';
import test from 'node:test';
import assert from 'node:assert/strict';
import { registerIntegrationBootstrap, getIntegrationBaseUrl } from './helpers/bootstrap';
import { stubFetchSuccess, stubFetchFailure } from './helpers/harness-mocks';
import { createClient } from './helpers/client';
import { loginAdmin, loginReadOnly } from './helpers/auth';
import { MERCHANT, ORG, USERS } from './helpers/fixtures';

registerIntegrationBootstrap();

test('authorization: admin can list merchants in own organization', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const res = await client.get('/api/v1/merchants?page=1&pageSize=5', ORG.merchantPro);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.data?.items));
  assert.ok((res.body.data?.items?.length ?? 0) > 0);
});

test('authorization: read-only user cannot create merchant', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginReadOnly(client);
  const res = await client.post('/api/v1/merchants', {
    legalName: 'Forbidden Merchant LLC',
    displayName: 'Forbidden',
    regionId: 1,
  }, ORG.merchantPro);
  assert.equal(res.status, 403);
});

test('authorization: organization isolation blocks cross-tenant merchant access', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client, ORG.merchantPro);
  const res = await client.get(`/api/v1/merchants/${MERCHANT.org2Active}`, ORG.merchantPro);
  assert.ok([403, 404].includes(res.status));
});

test('authorization: merchant isolation within organization', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client, ORG.secondOrg);
  const res = await client.get(`/api/v1/merchants/${MERCHANT.org1Active}`, ORG.secondOrg);
  assert.ok([403, 404].includes(res.status));
});

test('authorization: missing organization header returns validation error', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  client.setOrganizationId(null);
  const res = await client.get('/api/v1/merchants', null);
  assert.ok([400, 422].includes(res.status));
});

test('authorization: invalid tenant organization is forbidden', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const res = await client.get('/api/v1/merchants', 99999);
  assert.equal(res.status, 403);
});
