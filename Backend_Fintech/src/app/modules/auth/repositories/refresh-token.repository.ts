import { Pool, ResultSetHeader } from 'mysql2/promise';
import { getPool } from '../../../database';
import { RefreshTokenRecord } from '../types/auth.types';

export class RefreshTokenRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async create(data: {
    userId: number;
    sessionId: number;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO refresh_tokens (user_id, session_id, token_hash, expires_at) VALUES (?, ?, ?, ?)`,
      [data.userId, data.sessionId, data.tokenHash, data.expiresAt],
    );
    return result.insertId;
  }

  async findByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const [rows] = await this.pool.query<RefreshTokenRecord[]>(
      `SELECT * FROM refresh_tokens WHERE token_hash = ? LIMIT 1`,
      [tokenHash],
    );
    return rows[0] ?? null;
  }

  async revoke(tokenId: number): Promise<void> {
    await this.pool.query(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ?`, [tokenId]);
  }

  async revokeBySession(sessionId: number): Promise<void> {
    await this.pool.query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE session_id = ? AND revoked_at IS NULL`,
      [sessionId],
    );
  }

  async revokeAllForUserExceptSession(userId: number, exceptSessionId: number): Promise<void> {
    await this.pool.query(
      `UPDATE refresh_tokens SET revoked_at = NOW()
       WHERE user_id = ? AND session_id != ? AND revoked_at IS NULL`,
      [userId, exceptSessionId],
    );
  }

  async revokeAllForUser(userId: number): Promise<void> {
    await this.pool.query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL`,
      [userId],
    );
  }

  async markReplaced(tokenId: number, replacedByTokenId: number): Promise<void> {
    await this.pool.query(
      `UPDATE refresh_tokens SET revoked_at = NOW(), replaced_by_token_id = ? WHERE id = ?`,
      [replacedByTokenId, tokenId],
    );
  }
}
