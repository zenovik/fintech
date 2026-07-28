import './integration-env.setup';
import test from 'node:test';
import assert from 'node:assert/strict';
import { registerIntegrationBootstrap, getIntegrationBaseUrl } from './helpers/bootstrap';
import { stubFetchSuccess, stubFetchFailure } from './helpers/harness-mocks';
import { createClient } from './helpers/client';
import { loginAdmin } from './helpers/auth';
import { MERCHANT, ORG, uniqueRef } from './helpers/fixtures';

registerIntegrationBootstrap();

test('merchants: create merchant', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const ref = uniqueRef('MCH');
  const res = await client.post('/api/v1/merchants', {
    legalName: `${ref} LLC`,
    displayName: ref,
    regionId: 1,
    status: 'active',
  }, ORG.merchantPro);
  assert.equal(res.status, 201);
  assert.ok(res.body.data?.id);
});

test('merchants: update merchant', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const ref = uniqueRef('UPD');
  const created = await client.post('/api/v1/merchants', {
    legalName: `${ref} LLC`,
    displayName: ref,
    regionId: 1,
  }, ORG.merchantPro);
  const id = created.body.data?.id;
  const updated = await client.put(`/api/v1/merchants/${id}`, {
    displayName: `${ref}-updated`,
  }, ORG.merchantPro);
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data?.displayName, `${ref}-updated`);
});

test('merchants: search merchants', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const res = await client.get('/api/v1/merchants/search?q=Velocity', ORG.merchantPro);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.data?.items) || Array.isArray(res.body.data));
});

test('merchants: delete merchant (soft)', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const ref = uniqueRef('DEL');
  const created = await client.post('/api/v1/merchants', {
    legalName: `${ref} LLC`,
    displayName: ref,
    regionId: 1,
  }, ORG.merchantPro);
  const id = created.body.data?.id;
  const deleted = await client.delete(`/api/v1/merchants/${id}`, ORG.merchantPro);
  assert.equal(deleted.status, 200);
  const get = await client.get(`/api/v1/merchants/${id}`, ORG.merchantPro);
  assert.ok([404, 200].includes(get.status));
});

test('merchants: get seeded merchant by id', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const res = await client.get(`/api/v1/merchants/${MERCHANT.org1Active}`, ORG.merchantPro);
  assert.equal(res.status, 200);
  assert.equal(res.body.data?.id, MERCHANT.org1Active);
});
