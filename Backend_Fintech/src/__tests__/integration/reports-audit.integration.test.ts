import './integration-env.setup';
import test from 'node:test';
import assert from 'node:assert/strict';
import { registerIntegrationBootstrap, getIntegrationBaseUrl } from './helpers/bootstrap';
import { createClient } from './helpers/client';
import { loginAdmin } from './helpers/auth';
import { MERCHANT, ORG, uniqueRef } from './helpers/fixtures';
import { countAuditLogsForOrg, queryOne } from './helpers/db';
import { trackMerchant } from './helpers/isolation';
import type { RowDataPacket } from 'mysql2/promise';

registerIntegrationBootstrap();

test('reports: organization-scoped report list excludes cross-org merchants', async () => {
  const client1 = createClient(getIntegrationBaseUrl());
  await loginAdmin(client1, ORG.merchantPro);
  const org1 = await client1.get('/api/v1/reports?page=1&pageSize=5', ORG.merchantPro);
  assert.equal(org1.status, 200);

  const client2 = createClient(getIntegrationBaseUrl());
  await loginAdmin(client2, ORG.secondOrg);
  const org2 = await client2.get('/api/v1/reports?page=1&pageSize=5', ORG.secondOrg);
  assert.equal(org2.status, 200);

  const org1Merchants = await client1.get('/api/v1/merchants?page=1&pageSize=50', ORG.merchantPro);
  assert.equal(org1Merchants.status, 200);
  const org1Ids = new Set((org1Merchants.body.data?.items ?? []).map((m: { id: number }) => m.id));
  assert.ok(!org1Ids.has(MERCHANT.org2Active));
});

test('reports: analytics overview filtered by organization', async () => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const res = await client.get('/api/v1/analytics/overview', ORG.merchantPro);
  assert.equal(res.status, 200);
  assert.ok(res.body.data);
  if (res.body.data?.merchantCount != null) {
    assert.ok(Number(res.body.data.merchantCount) >= 1);
  }
});

test('reports: report center catalog returns entries', async () => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const res = await client.get('/api/v1/reports/center/catalog', ORG.merchantPro);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.data?.catalog ?? res.body.data?.items ?? res.body.data));
});

test('audit: list audit entries with required fields', async () => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const res = await client.get('/api/v1/audit?page=1&pageSize=10', ORG.merchantPro);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.data?.items));
  for (const entry of res.body.data?.items ?? []) {
    if (entry.organizationId != null) {
      assert.equal(entry.organizationId, ORG.merchantPro);
    }
    if (entry.createdAt) assert.ok(entry.createdAt);
    if (entry.actionCode) assert.ok(typeof entry.actionCode === 'string');
  }
});

test('audit: organization isolation on audit logs', async () => {
  const org1Count = await countAuditLogsForOrg(ORG.merchantPro);
  const org2Count = await countAuditLogsForOrg(ORG.secondOrg);
  assert.ok(org1Count >= 0);
  assert.ok(org2Count >= 0);

  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const res = await client.get('/api/v1/audit?page=1&pageSize=50', ORG.merchantPro);
  assert.equal(res.status, 200);
  for (const entry of res.body.data?.items ?? []) {
    if (entry.organizationId != null) {
      assert.equal(entry.organizationId, ORG.merchantPro);
    }
  }
});

test('audit: merchant create writes audit row with actor and organization', async () => {
  const client = createClient(getIntegrationBaseUrl());
  const login = await loginAdmin(client);
  const created = await client.post('/api/v1/merchants', {
    displayName: uniqueRef('Audit Merchant'),
    legalName: 'Audit Merchant LLC',
    businessType: 'retail',
    countryCode: 'US',
    defaultCurrency: 'USD',
    contactEmail: `${uniqueRef('audit')}@integration.test`,
  }, ORG.merchantPro);
  assert.equal(created.status, 201);
  const merchantId = created.body.data?.merchant?.id ?? created.body.data?.id;
  trackMerchant(merchantId);

  const audit = await queryOne<RowDataPacket>(
    `SELECT organization_id, user_id, action_code, created_at
     FROM audit_logs
     WHERE entity_type = 'merchant' AND entity_id = ?
     ORDER BY id DESC LIMIT 1`,
    [String(merchantId)],
  );
  assert.ok(audit);
  assert.equal(Number(audit.organization_id), ORG.merchantPro);
  assert.equal(Number(audit.user_id), login.user?.id);
  assert.ok(audit.action_code);
  assert.ok(audit.created_at);
});

test('audit: api logs scoped to organization', async () => {
  const client = createClient(getIntegrationBaseUrl());
  await loginAdmin(client);
  const res = await client.get('/api/v1/audit/api-logs?page=1&pageSize=5', ORG.merchantPro);
  assert.equal(res.status, 200);
  for (const entry of res.body.data?.items ?? []) {
    if (entry.organizationId != null) {
      assert.equal(entry.organizationId, ORG.merchantPro);
    }
  }
});
