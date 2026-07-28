import { SystemRepository } from '../repositories/system.repository';

export class SystemConfigService {
  constructor(private readonly repo = new SystemRepository()) {}

  async listCacheConfig() {
    const rows = await this.repo.listCacheConfig();
    return rows.map((r) => ({
      id: r.id, uuid: r.uuid, cacheKey: r.cache_key, provider: r.provider,
      ttlSeconds: r.ttl_seconds, isEnabled: Boolean(r.is_enabled), updatedAt: r.updated_at,
    }));
  }

  async updateCacheConfig(id: number, dto: Record<string, unknown>) {
    await this.repo.updateCacheConfig(id, dto);
    const rows = await this.repo.listCacheConfig();
    return rows.find((r) => r.id === id) ?? { id };
  }

  async listBackupConfig() {
    const rows = await this.repo.listBackupConfig();
    return rows.map((r) => ({
      id: r.id, uuid: r.uuid, backupType: r.backup_type, scheduleCron: r.schedule_cron,
      retentionDays: r.retention_days, destination: r.destination,
      isEnabled: Boolean(r.is_enabled), lastRunAt: r.last_run_at, updatedAt: r.updated_at,
    }));
  }

  async updateBackupConfig(id: number, dto: Record<string, unknown>) {
    await this.repo.updateBackupConfig(id, dto);
    const rows = await this.repo.listBackupConfig();
    return rows.find((r) => r.id === id) ?? { id };
  }

  async getJobHistory(query: { page: number; pageSize: number }) {
    const { items, total } = await this.repo.getJobHistory(query);
    return {
      items: items.map((r) => ({
        id: r.id, uuid: r.uuid, jobType: r.job_type, status: r.status,
        errorMessage: r.error_message, startedAt: r.started_at, completedAt: r.completed_at, createdAt: r.created_at,
      })),
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) || 1 },
    };
  }

  async getPerformanceMetrics() {
    const data = await this.repo.getPerformanceMetrics();
    return {
      backgroundJobs: (data.backgroundJobs ?? []).map((r) => ({ status: r.status, count: Number(r.cnt) })),
      apiUsage: {
        avgLatencyMs: Number(data.apiUsage?.avg_latency ?? 0),
        requests1h: Number(data.apiUsage?.requests_1h ?? 0),
      },
    };
  }
}
