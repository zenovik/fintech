import { Pool } from 'mysql2/promise';
import { getPool } from '../../../database';

export class AuditRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async log(data: {
    userId?: number;
    sessionId?: number;
    eventType: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.pool.query(
      `INSERT INTO auth_audit_logs (user_id, session_id, event_type, ip_address, user_agent, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.userId ?? null,
        data.sessionId ?? null,
        data.eventType,
        data.ipAddress ?? null,
        data.userAgent ?? null,
        data.metadata ? JSON.stringify(data.metadata) : null,
      ],
    );
  }
}
