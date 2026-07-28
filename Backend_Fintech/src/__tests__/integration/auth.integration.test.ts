import './integration-env.setup';
import test from 'node:test';
import assert from 'node:assert/strict';
import { registerIntegrationBootstrap, getIntegrationBaseUrl } from './helpers/bootstrap';
import { stubFetchSuccess, stubFetchFailure } from './helpers/harness-mocks';
import { createClient } from './helpers/client';
import { loginAdmin, loginAs, insertPasswordResetToken, getUserIdByEmail } from './helpers/auth';
import { SEED_PASSWORD, USERS, uniqueEmail } from './helpers/fixtures';

registerIntegrationBootstrap();

test('auth: login returns access token and user profile', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  const data = await loginAdmin(client);
  assert.ok(data.accessToken);
  const me = await client.get('/api/auth/me', USERS.admin.orgId);
  assert.equal(me.status, 200);
  assert.equal(me.body.data?.email, USERS.admin.email);
});

test('auth: logout clears session', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const logout = await client.post('/api/auth/logout');
  assert.equal(logout.status, 200);
  const me = await client.get('/api/auth/me');
  assert.equal(me.status, 401);
});

test('auth: refresh token issues new access token', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  const login = await loginAdmin(client);
  assert.ok(login.refreshToken);
  const refreshed = await client.post('/api/auth/refresh-token', { refreshToken: login.refreshToken });
  assert.equal(refreshed.status, 200);
  assert.ok(refreshed.body.data?.accessToken);
});

test('auth: forgot password accepts valid email', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  const res = await client.post('/api/auth/forgot-password', { email: USERS.admin.email });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
});

test('auth: reset password with valid token', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const email = uniqueEmail('reset');
  const create = await client.post('/api/v1/users', {
    email,
    password: SEED_PASSWORD,
    firstName: 'Reset',
    lastName: 'Test',
    status: 'active',
  }, USERS.admin.orgId);
  assert.equal(create.status, 201);
  const userId = create.body.data?.id ?? (await getUserIdByEmail(email));
  const rawToken = `reset-token-${Date.now()}`;
  await insertPasswordResetToken(userId, rawToken);
  const newPassword = 'NewPassword123!';
  const reset = await client.post('/api/auth/reset-password', {
    token: rawToken,
    newPassword,
    confirmPassword: newPassword,
  });
  assert.equal(reset.status, 200);
  const login = await loginAs(createClient(getIntegrationBaseUrl()), email, newPassword);
  assert.ok(login.accessToken);
});

test('auth: login rejects invalid credentials', async (t) => {
  const client = createClient(getIntegrationBaseUrl());
  const res = await client.post('/api/auth/login', {
    email: USERS.admin.email,
    password: 'WrongPassword!',
  });
  assert.equal(res.status, 401);
});
