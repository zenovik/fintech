import './integration-env.setup';
import test from 'node:test';
import assert from 'node:assert/strict';
import { registerIntegrationBootstrap } from './helpers/bootstrap';
import {
  getDbPool,
  verifyForeignKeys,
  verifyTenantColumn,
  queryOne,
  runInTransaction,
} from './helpers/db';
import type { RowDataPacket } from 'mysql2/promise';

registerIntegrationBootstrap();

test('database: connection ping succeeds', async () => {
  const pool = getDbPool();
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
});

test('database: foreign keys exist', async () => {
  assert.equal(await verifyForeignKeys(), true);
});

test('database: tenant isolation columns on core tables', async () => {
  assert.equal(await verifyTenantColumn('merchants'), true);
  assert.equal(await verifyTenantColumn('audit_logs'), true);
  assert.equal(await verifyTenantColumn('customers'), true);
});

test('database: indexes on organization scoped tables', async () => {
  const row = await queryOne<RowDataPacket>(
    `SELECT COUNT(*) AS cnt FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'merchants' AND COLUMN_NAME = 'organization_id'`,
  );
  assert.ok(Number(row?.cnt ?? 0) >= 1);
});

test('database: transaction rollback does not persist changes', async () => {
  const marker = `rollback-test-${Date.now()}`;
  await runInTransaction(async (conn) => {
    await conn.query(
      `INSERT INTO background_jobs (uuid, job_type, payload, status) VALUES (UUID(), 'test_rollback', ?, 'queued')`,
      [JSON.stringify({ marker })],
    );
  });
  const row = await queryOne<RowDataPacket>(
    `SELECT id FROM background_jobs WHERE job_type = 'test_rollback' AND JSON_EXTRACT(payload, '$.marker') = ?`,
    [marker],
  );
  assert.equal(row, null);
});

test('database: merchant organization_id enforces tenant isolation', async () => {
  const org1 = await queryOne<RowDataPacket>(
    'SELECT organization_id FROM merchants WHERE id = 1',
  );
  const org16 = await queryOne<RowDataPacket>(
    'SELECT organization_id FROM merchants WHERE id = 16',
  );
  assert.equal(Number(org1?.organization_id), 1);
  assert.equal(Number(org16?.organization_id), 2);
});
