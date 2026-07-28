import mysql from 'mysql2/promise';
import { env } from '../config';

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.name,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      timezone: 'Z',
      dateStrings: false,
    });
  }
  return pool;
}

export async function testConnection(): Promise<void> {
  const connection = await getPool().getConnection();
  await connection.ping();
  connection.release();
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
