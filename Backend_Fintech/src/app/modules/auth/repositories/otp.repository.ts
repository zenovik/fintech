import { Pool, ResultSetHeader } from 'mysql2/promise';
import { getPool } from '../../../database';
import { OtpRecord } from '../types/auth.types';

export class OtpRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async create(data: {
    userId: number;
    challengeId?: number;
    purpose: OtpRecord['purpose'];
    otpHash: string;
    channel: OtpRecord['channel'];
    destinationMasked?: string;
    expiresAt: Date;
    maxAttempts?: number;
  }): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO otp_verifications (
        user_id, challenge_id, purpose, otp_hash, channel, destination_masked,
        expires_at, max_attempts, last_sent_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        data.userId,
        data.challengeId ?? null,
        data.purpose,
        data.otpHash,
        data.channel,
        data.destinationMasked ?? null,
        data.expiresAt,
        data.maxAttempts ?? 5,
      ],
    );
    return result.insertId;
  }

  async findLatestByChallenge(challengeId: number): Promise<OtpRecord | null> {
    const [rows] = await this.pool.query<OtpRecord[]>(
      `SELECT * FROM otp_verifications
       WHERE challenge_id = ? AND verified_at IS NULL
       ORDER BY created_at DESC LIMIT 1`,
      [challengeId],
    );
    return rows[0] ?? null;
  }

  async incrementAttempts(otpId: number): Promise<void> {
    await this.pool.query(`UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?`, [
      otpId,
    ]);
  }

  async markVerified(otpId: number): Promise<void> {
    await this.pool.query(`UPDATE otp_verifications SET verified_at = NOW() WHERE id = ?`, [otpId]);
  }

  async updateLastSent(otpId: number): Promise<void> {
    await this.pool.query(`UPDATE otp_verifications SET last_sent_at = NOW() WHERE id = ?`, [
      otpId,
    ]);
  }
}
