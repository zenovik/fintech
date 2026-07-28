import { Pool } from 'mysql2/promise';
import { getPool } from '../../../database';

export class LoginAttemptRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async create(data: {
    userId?: number;
    email: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    failureReason?: string;
  }): Promise<void> {
    await this.pool.query(
      `INSERT INTO login_attempts (user_id, email_attempted, ip_address, user_agent, success, failure_reason)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.userId ?? null,
        data.email,
        data.ipAddress ?? null,
        data.userAgent ?? null,
        data.success ? 1 : 0,
        data.failureReason ?? null,
      ],
    );
  }
}
