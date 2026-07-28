import { Pool, ResultSetHeader } from 'mysql2/promise';
import { getPool } from '../../../database';
import { PasswordResetTokenRecord } from '../types/auth.types';

export class PasswordResetRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async create(data: {
    userId: number;
    tokenHash: string;
    expiresInMinutes: number;
    requestedIp?: string;
  }): Promise<number> {
    await this.pool.query(`UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL`, [
      data.userId,
    ]);
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, requested_ip)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), ?)`,
      [data.userId, data.tokenHash, data.expiresInMinutes, data.requestedIp ?? null],
    );
    return result.insertId;
  }

  async findValidByHash(tokenHash: string): Promise<PasswordResetTokenRecord | null> {
    const [rows] = await this.pool.query<PasswordResetTokenRecord[]>(
      `SELECT * FROM password_reset_tokens
       WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1`,
      [tokenHash],
    );
    return rows[0] ?? null;
  }

  async markUsed(tokenId: number): Promise<void> {
    await this.pool.query(`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?`, [
      tokenId,
    ]);
  }
}
