import { Pool, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';

export class PasswordHistoryRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async add(userId: number, passwordHash: string): Promise<void> {
    await this.pool.query(`INSERT INTO password_history (user_id, password_hash) VALUES (?, ?)`, [
      userId,
      passwordHash,
    ]);
  }

  async isReused(userId: number, passwordHash: string, limit = 5): Promise<boolean> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT password_hash FROM password_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [userId, limit],
    );
    return rows.some((row) => row.password_hash === passwordHash);
  }
}
