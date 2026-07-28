import { Pool, ResultSetHeader } from 'mysql2/promise';
import { getPool } from '../../../database';
import { SessionRecord } from '../types/auth.types';

export class SessionRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async create(data: {
    uuid: string;
    userId: number;
    trustedDeviceId?: number | null;
    ipAddress?: string;
    userAgent?: string;
    deviceName?: string;
    browser?: string;
    os?: string;
    expiresAt: Date;
    trustedUntil?: Date | null;
  }): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO user_sessions (
        uuid, user_id, trusted_device_id, ip_address, user_agent,
        device_name, browser, os, status, last_activity_at, expires_at, trusted_until
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW(), ?, ?)`,
      [
        data.uuid,
        data.userId,
        data.trustedDeviceId ?? null,
        data.ipAddress ?? null,
        data.userAgent ?? null,
        data.deviceName ?? null,
        data.browser ?? null,
        data.os ?? null,
        data.expiresAt,
        data.trustedUntil ?? null,
      ],
    );
    return result.insertId;
  }

  async findByUuid(uuid: string): Promise<SessionRecord | null> {
    const [rows] = await this.pool.query<SessionRecord[]>(
      `SELECT * FROM user_sessions WHERE uuid = ? LIMIT 1`,
      [uuid],
    );
    return rows[0] ?? null;
  }

  async findById(id: number): Promise<SessionRecord | null> {
    const [rows] = await this.pool.query<SessionRecord[]>(
      `SELECT * FROM user_sessions WHERE id = ? LIMIT 1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async findActiveByUserId(userId: number): Promise<SessionRecord[]> {
    const [rows] = await this.pool.query<SessionRecord[]>(
      `SELECT * FROM user_sessions
       WHERE user_id = ? AND status = 'active' AND expires_at > NOW()
       ORDER BY last_activity_at DESC`,
      [userId],
    );
    return rows;
  }

  async updateActivity(sessionId: number): Promise<void> {
    await this.pool.query(`UPDATE user_sessions SET last_activity_at = NOW() WHERE id = ?`, [
      sessionId,
    ]);
  }

  async revoke(sessionId: number): Promise<void> {
    await this.pool.query(
      `UPDATE user_sessions SET status = 'revoked', revoked_at = NOW() WHERE id = ?`,
      [sessionId],
    );
  }

  async revokeAllExcept(userId: number, exceptSessionId: number): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `UPDATE user_sessions SET status = 'revoked', revoked_at = NOW()
       WHERE user_id = ? AND id != ? AND status = 'active'`,
      [userId, exceptSessionId],
    );
    return result.affectedRows;
  }

  async revokeAllForUser(userId: number): Promise<void> {
    await this.pool.query(
      `UPDATE user_sessions SET status = 'revoked', revoked_at = NOW()
       WHERE user_id = ? AND status = 'active'`,
      [userId],
    );
  }
}
