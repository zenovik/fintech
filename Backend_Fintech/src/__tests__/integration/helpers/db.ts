import type { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getPool } from '../../../app/database/connection';

export function getDbPool(): Pool {
  return getPool();
}

export async function queryOne<T extends RowDataPacket>(
  sql: string,
  params: unknown[] = [],
  pool: Pool = getPool(),
): Promise<T | null> {
  const [rows] = await pool.query<T[]>(sql, params);
  return rows[0] ?? null;
}

export async function queryAll<T extends RowDataPacket>(
  sql: string,
  params: unknown[] = [],
  pool: Pool = getPool(),
): Promise<T[]> {
  const [rows] = await pool.query<T[]>(sql, params);
  return rows;
}

export async function insertRow(
  sql: string,
  params: unknown[],
  pool: Pool = getPool(),
): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(sql, params);
  return result.insertId;
}

export async function verifyForeignKeys(pool: Pool = getPool()): Promise<boolean> {
  const row = await queryOne<RowDataPacket>(
    `SELECT COUNT(*) AS cnt FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
    [],
    pool,
  );
  return Number(row?.cnt ?? 0) > 50;
}

export async function verifyTenantColumn(table: string, pool: Pool = getPool()): Promise<boolean> {
  const row = await queryOne<RowDataPacket>(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'organization_id'`,
    [table],
    pool,
  );
  return Number(row?.cnt ?? 0) === 1;
}

export async function runInTransaction<T>(
  fn: (conn: import('mysql2/promise').PoolConnection) => Promise<T>,
  pool: Pool = getPool(),
): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.rollback();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function claimBackgroundJobs(
  limit: number,
  pool: Pool = getPool(),
  jobType?: string,
): Promise<number[]> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const typeClause = jobType ? ' AND job_type = ?' : '';
    const [concRows] = await conn.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM background_jobs
       WHERE status = 'queued'
         AND JSON_UNQUOTE(JSON_EXTRACT(payload, '$.recipient')) LIKE 'conc-%@example.com'`,
    );
    const concOnly = Number(concRows[0]?.cnt ?? 0) > 0;
    const recipientClause = concOnly
      ? ` AND JSON_UNQUOTE(JSON_EXTRACT(payload, '$.recipient')) LIKE 'conc-%@example.com'`
      : '';
    const selectParams: unknown[] = jobType ? [jobType, limit] : [limit];
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT id FROM background_jobs WHERE status = 'queued'${typeClause}${recipientClause} ORDER BY created_at ASC LIMIT ? FOR UPDATE SKIP LOCKED`,
      selectParams,
    );
    const ids = rows.map((r) => Number(r.id));
    if (ids.length) {
      await conn.query(
        `UPDATE background_jobs SET status = 'running', started_at = NOW() WHERE id IN (${ids.map(() => '?').join(',')})`,
        ids,
      );
    }
    await conn.commit();
    return ids;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function claimNotificationEmails(limit: number, pool: Pool = getPool()): Promise<number[]> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT id FROM notification_deliveries
       WHERE channel = 'email' AND status = 'pending'
       ORDER BY created_at ASC LIMIT ? FOR UPDATE`,
      [limit],
    );
    const ids = rows.map((r) => Number(r.id));
    await conn.commit();
    return ids;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function countAuditLogsForOrg(orgId: number, pool: Pool = getPool()): Promise<number> {
  const row = await queryOne<RowDataPacket>(
    'SELECT COUNT(*) AS cnt FROM audit_logs WHERE organization_id = ?',
    [orgId],
    pool,
  );
  return Number(row?.cnt ?? 0);
}
