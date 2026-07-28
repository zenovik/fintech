import { Pool, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';

export class SystemRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async listCacheConfig() {
    const [rows] = await this.pool.query<RowDataPacket[]>(`SELECT * FROM cache_configurations ORDER BY cache_key`);
    return rows;
  }

  async updateCacheConfig(id: number, data: Record<string, unknown>) {
    await this.pool.query(
      `UPDATE cache_configurations SET provider = ?, ttl_seconds = ?, is_enabled = ? WHERE id = ?`,
      [data.provider, data.ttlSeconds, data.isEnabled ?? 1, id],
    );
  }

  async listBackupConfig() {
    const [rows] = await this.pool.query<RowDataPacket[]>(`SELECT * FROM backup_configurations ORDER BY backup_type`);
    return rows;
  }

  async updateBackupConfig(id: number, data: Record<string, unknown>) {
    await this.pool.query(
      `UPDATE backup_configurations SET schedule_cron = ?, retention_days = ?, destination = ?, is_enabled = ? WHERE id = ?`,
      [data.scheduleCron, data.retentionDays, data.destination, data.isEnabled ?? 1, id],
    );
  }

  async getJobHistory(query: { page: number; pageSize: number }) {
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM background_jobs`);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id, uuid, job_type, status, error_message, started_at, completed_at, created_at
       FROM background_jobs ORDER BY created_at DESC LIMIT ? OFFSET ?`, [query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async getPerformanceMetrics() {
    const [jobs] = await this.pool.query<RowDataPacket[]>(
      `SELECT status, COUNT(*) AS cnt FROM background_jobs GROUP BY status`,
    );
    const [apiUsage] = await this.pool.query<RowDataPacket[]>(
      `SELECT AVG(latency_ms) AS avg_latency, COUNT(*) AS requests_1h
       FROM api_usage_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
    );
    return { backgroundJobs: jobs, apiUsage: apiUsage[0] };
  }
}
