import { Pool, ResultSetHeader } from 'mysql2/promise';
import { getPool } from '../../../database';
import { TrustedDeviceRecord } from '../types/auth.types';

export class TrustedDeviceRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async findValid(userId: number, fingerprint: string): Promise<TrustedDeviceRecord | null> {
    const [rows] = await this.pool.query<TrustedDeviceRecord[]>(
      `SELECT * FROM trusted_devices
       WHERE user_id = ? AND device_fingerprint = ? AND trusted_until > NOW() AND deleted_at IS NULL
       LIMIT 1`,
      [userId, fingerprint],
    );
    return rows[0] ?? null;
  }

  async upsert(data: {
    userId: number;
    fingerprint: string;
    deviceLabel?: string;
    trustedUntil: Date;
  }): Promise<number> {
    const existing = await this.findValid(data.userId, data.fingerprint);
    if (existing) {
      await this.pool.query(
        `UPDATE trusted_devices SET trusted_until = ?, last_used_at = NOW(), device_label = COALESCE(?, device_label) WHERE id = ?`,
        [data.trustedUntil, data.deviceLabel ?? null, existing.id],
      );
      return existing.id;
    }
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO trusted_devices (user_id, device_fingerprint, device_label, trusted_until, last_used_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [data.userId, data.fingerprint, data.deviceLabel ?? null, data.trustedUntil],
    );
    return result.insertId;
  }
}
