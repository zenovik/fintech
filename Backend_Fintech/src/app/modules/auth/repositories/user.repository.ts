import { Pool, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { UserRecord } from '../types/auth.types';

export class UserRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async findByEmail(email: string): Promise<UserRecord | null> {
    const [rows] = await this.pool.query<UserRecord[]>(
      `SELECT * FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1`,
      [email],
    );
    return rows[0] ?? null;
  }

  async findById(id: number): Promise<UserRecord | null> {
    const [rows] = await this.pool.query<UserRecord[]>(
      `SELECT * FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async findByUuid(uuid: string): Promise<UserRecord | null> {
    const [rows] = await this.pool.query<UserRecord[]>(
      `SELECT * FROM users WHERE uuid = ? AND deleted_at IS NULL LIMIT 1`,
      [uuid],
    );
    return rows[0] ?? null;
  }

  async updateLoginSuccess(userId: number): Promise<void> {
    await this.pool.query(
      `UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = NOW() WHERE id = ?`,
      [userId],
    );
  }

  async incrementFailedAttempts(userId: number): Promise<void> {
    await this.pool.query(
      `UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ?`,
      [userId],
    );
  }

  async lockAccount(userId: number, lockedUntil: Date): Promise<void> {
    await this.pool.query(
      `UPDATE users SET status = 'locked', locked_until = ? WHERE id = ?`,
      [lockedUntil, userId],
    );
  }

  async unlockIfExpired(userId: number): Promise<void> {
    await this.pool.query(
      `UPDATE users SET status = 'active', locked_until = NULL, failed_login_attempts = 0
       WHERE id = ? AND status = 'locked' AND locked_until IS NOT NULL AND locked_until <= NOW()`,
      [userId],
    );
  }

  async updatePassword(userId: number, passwordHash: string): Promise<void> {
    await this.pool.query(
      `UPDATE users SET password_hash = ?, password_changed_at = NOW(), updated_at = NOW() WHERE id = ?`,
      [passwordHash, userId],
    );
  }

  async updateMfaPreferences(userId: number, mfaEnabled: boolean, mfaMethod?: string): Promise<void> {
    await this.pool.query(
      `UPDATE users SET mfa_enabled = ?, mfa_method = ?, updated_at = NOW() WHERE id = ?`,
      [mfaEnabled ? 1 : 0, mfaMethod ?? null, userId],
    );
  }
}

export async function emailExists(email: string): Promise<boolean> {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 1 FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1`,
    [email],
  );
  return rows.length > 0;
}
