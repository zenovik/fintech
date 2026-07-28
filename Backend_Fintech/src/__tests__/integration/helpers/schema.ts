import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import mysql from 'mysql2/promise';
import { env } from '../../../app/config';

const REQUIRED_TABLES = [
  'users',
  'organizations',
  'organization_members',
  'merchants',
  'customers',
  'payment_orders',
  'payment_intents',
  'payment_timeline_events',
  'checkout_sessions',
  'background_jobs',
  'retry_queue',
  'merchant_webhooks',
  'webhook_delivery_queue',
  'audit_logs',
  'notification_deliveries',
  'roles',
  'user_roles',
] as const;

const MASTER_SQL_PATH = resolve(process.cwd(), '../Database_Fintech/master_database.sql');

export class IntegrationEnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IntegrationEnvironmentError';
  }
}

async function tableExists(conn: mysql.Connection, table: string): Promise<boolean> {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) AS cnt FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [env.db.name, table],
  );
  return Number(rows[0]?.cnt ?? 0) === 1;
}

async function schemaNeedsImport(conn: mysql.Connection): Promise<boolean> {
  for (const table of REQUIRED_TABLES) {
    if (!(await tableExists(conn, table))) return true;
  }
  const [seedRows] = await conn.query<mysql.RowDataPacket[]>(
    "SELECT id FROM users WHERE email = 'admin@merchantpro.com' LIMIT 1",
  );
  return seedRows.length === 0;
}

function normalizeSqlForTestDatabase(sql: string): string {
  const db = env.db.name;
  return sql
    .replace(/CREATE DATABASE IF NOT EXISTS fintech_db/gi, `CREATE DATABASE IF NOT EXISTS \`${db}\``)
    .replace(/\bUSE fintech_db\b/gi, `USE \`${db}\``)
    .replace(/\bfintech_db\./g, `${db}.`);
}

function importMasterDatabase(): void {
  if (!existsSync(MASTER_SQL_PATH)) {
    throw new IntegrationEnvironmentError(
      `Schema file not found at ${MASTER_SQL_PATH}. Run Database_Fintech/scripts/build-master.ps1 first.`,
    );
  }

  const sql = normalizeSqlForTestDatabase(readFileSync(MASTER_SQL_PATH, 'utf8'));
  const bootstrapSql = [
    'SET FOREIGN_KEY_CHECKS=0;',
    `DROP DATABASE IF EXISTS \`${env.db.name}\`;`,
    `CREATE DATABASE \`${env.db.name}\`;`,
    `USE \`${env.db.name}\`;`,
    sql,
    'SET FOREIGN_KEY_CHECKS=1;',
  ].join('\n');

  const tmpFile = join(tmpdir(), `integration-schema-${Date.now()}.sql`);
  writeFileSync(tmpFile, bootstrapSql, 'utf8');
  try {
    const sourcePath = tmpFile.replace(/\\/g, '/');
    const result = spawnSync(
      'mysql',
      ['-h', env.db.host, '-P', String(env.db.port), '-u', env.db.user, '-e', `source ${sourcePath}`],
      {
        encoding: 'utf8',
        maxBuffer: 256 * 1024 * 1024,
        env: { ...process.env, MYSQL_PWD: env.db.password },
      },
    );

    if (result.status !== 0) {
      const detail = (result.stderr ?? result.stdout ?? '').trim().slice(0, 2000);
      throw new IntegrationEnvironmentError(
        `Schema import failed (exit ${result.status ?? 'unknown'}): ${detail || 'mysql CLI error'}`,
      );
    }
  } finally {
    unlinkSync(tmpFile);
  }
}

export async function validateIntegrationEnvironment(): Promise<void> {
  let conn: mysql.Connection | null = null;
  try {
    conn = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      connectTimeout: 10000,
      multipleStatements: true,
    });
    await conn.ping();

    const [dbRows] = await conn.query<mysql.RowDataPacket[]>(
      'SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?',
      [env.db.name],
    );
    if (!dbRows.length) {
      await conn.query(`CREATE DATABASE IF NOT EXISTS \`${env.db.name}\``);
    }
    await conn.end();
    conn = null;

    conn = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.name,
      connectTimeout: 10000,
    });

    if (await schemaNeedsImport(conn)) {
      await conn.end();
      conn = null;
      console.log('[integration] Importing master_database.sql — required tables or seed data missing.');
      importMasterDatabase();
      conn = await mysql.createConnection({
        host: env.db.host,
        port: env.db.port,
        user: env.db.user,
        password: env.db.password,
        database: env.db.name,
        connectTimeout: 10000,
      });
    }

    for (const table of REQUIRED_TABLES) {
      if (!(await tableExists(conn, table))) {
        throw new IntegrationEnvironmentError(
          `Required table "${table}" is missing in "${env.db.name}" after schema import.`,
        );
      }
    }

    const [seedRows] = await conn.query<mysql.RowDataPacket[]>(
      "SELECT id FROM users WHERE email = 'admin@merchantpro.com' LIMIT 1",
    );
    if (!seedRows.length) {
      throw new IntegrationEnvironmentError(
        'Seed data missing (admin@merchantpro.com) after schema import.',
      );
    }
  } catch (err) {
    if (err instanceof IntegrationEnvironmentError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    throw new IntegrationEnvironmentError(
      `Integration database unavailable at ${env.db.host}:${env.db.port}/${env.db.name}: ${message}`,
    );
  } finally {
    await conn?.end().catch(() => {});
  }
}
