import './integration-env.setup';
import test from 'node:test';
import assert from 'node:assert/strict';
import { registerIntegrationBootstrap, getIntegrationBaseUrl } from './helpers/bootstrap';
import { stubFetchSuccess, stubFetchFailure } from './helpers/harness-mocks';
import { createClient } from './helpers/client';
import { loginAdmin } from './helpers/auth';
import { ORG, SEED_PASSWORD, uniqueEmail } from './helpers/fixtures';

registerIntegrationBootstrap();

test('users: invite (create pending user)', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const email = uniqueEmail('invite');
  const res = await client.post('/api/v1/users', {
    email,
    password: SEED_PASSWORD,
    firstName: 'Invited',
    lastName: 'User',
    status: 'pending',
  }, ORG.merchantPro);
  assert.equal(res.status, 201);
  assert.equal(res.body.data?.status, 'pending');
});

test('users: disable user via status patch', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const email = uniqueEmail('disable');
  const created = await client.post('/api/v1/users', {
    email,
    password: SEED_PASSWORD,
    firstName: 'Disable',
    lastName: 'Me',
    status: 'active',
  }, ORG.merchantPro);
  const id = created.body.data?.id;
  const disabled = await client.patch(`/api/v1/users/${id}/status`, {
    status: 'inactive',
    reason: 'Integration test disable',
  }, ORG.merchantPro);
  assert.equal(disabled.status, 200);
  assert.equal(disabled.body.data?.status, 'inactive');
});

test('users: role changes via assign roles', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const email = uniqueEmail('roles');
  const created = await client.post('/api/v1/users', {
    email,
    password: SEED_PASSWORD,
    firstName: 'Role',
    lastName: 'Change',
    status: 'active',
    roleIds: [7],
  }, ORG.merchantPro);
  const id = created.body.data?.id;
  const updated = await client.put(`/api/v1/users/${id}/roles`, { roleIds: [6] }, ORG.merchantPro);
  assert.equal(updated.status, 200);
});

test('users: organization member invite flow', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const email = uniqueEmail('member');
  const user = await client.post('/api/v1/users', {
    email,
    password: SEED_PASSWORD,
    firstName: 'Org',
    lastName: 'Member',
    status: 'active',
  }, ORG.merchantPro);
  const userId = user.body.data?.id;
  const member = await client.post(`/api/v1/organizations/${ORG.merchantPro}/members`, {
    userId,
    orgRoleId: 2,
    status: 'invited',
  }, ORG.merchantPro);
  assert.equal(member.status, 201);
  assert.equal(member.body.data?.status, 'invited');
});
