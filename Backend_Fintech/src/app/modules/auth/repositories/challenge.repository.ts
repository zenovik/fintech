import { Pool, ResultSetHeader } from 'mysql2/promise';
import { getPool } from '../../../database';
import { AuthChallengeRecord } from '../types/auth.types';

export class ChallengeRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async create(data: {
    uuid: string;
    userId: number;
    challengeType: 'mfa_totp' | 'mfa_sms' | 'login_stepup';
    rememberDevice: boolean;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO auth_challenges (
        uuid, user_id, challenge_type, remember_device, expires_at, ip_address, user_agent, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        data.uuid,
        data.userId,
        data.challengeType,
        data.rememberDevice ? 1 : 0,
        data.expiresAt,
        data.ipAddress ?? null,
        data.userAgent ?? null,
      ],
    );
    return result.insertId;
  }

  async findByUuid(uuid: string): Promise<AuthChallengeRecord | null> {
    const [rows] = await this.pool.query<AuthChallengeRecord[]>(
      `SELECT * FROM auth_challenges WHERE uuid = ? LIMIT 1`,
      [uuid],
    );
    return rows[0] ?? null;
  }

  async markVerified(challengeId: number, sessionId?: number): Promise<void> {
    await this.pool.query(
      `UPDATE auth_challenges SET status = 'verified', verified_at = NOW(), session_id = COALESCE(?, session_id) WHERE id = ?`,
      [sessionId ?? null, challengeId],
    );
  }

  async markExpired(challengeId: number): Promise<void> {
    await this.pool.query(`UPDATE auth_challenges SET status = 'expired' WHERE id = ?`, [
      challengeId,
    ]);
  }
}
