import { NotFoundError } from '../../../shared/exceptions/app.exception';
import { auditRecorder } from '../../audit';
import { OperationsRepository } from '../repositories/operations.repository';
import { AlertListQueryDto, IncidentListQueryDto, JobListQueryDto, RetryListQueryDto } from '../dto';

function mapAlert(row: Record<string, unknown>) {
  return {
    id: row.id, uuid: row.uuid, organizationId: row.organization_id, alertType: row.alert_type,
    severity: row.severity, title: row.title, message: row.message, source: row.source, status: row.status,
    relatedEntityType: row.related_entity_type, relatedEntityId: row.related_entity_id,
    acknowledgedAt: row.acknowledged_at, resolvedAt: row.resolved_at, createdAt: row.created_at,
  };
}

function mapIncident(row: Record<string, unknown>) {
  return {
    id: row.id, uuid: row.uuid, organizationId: row.organization_id, incidentRef: row.incident_ref,
    title: row.title, description: row.description, severity: row.severity, status: row.status,
    impactSummary: row.impact_summary, startedAt: row.started_at, resolvedAt: row.resolved_at, createdAt: row.created_at,
  };
}

function mapRetry(row: Record<string, unknown>) {
  return {
    id: row.id, uuid: row.uuid, organizationId: row.organization_id, entityType: row.entity_type,
    entityId: row.entity_id, operation: row.operation, status: row.status,
    attemptCount: Number(row.attempt_count), maxAttempts: Number(row.max_attempts),
    lastError: row.last_error, scheduledAt: row.scheduled_at, processedAt: row.processed_at, createdAt: row.created_at,
  };
}

function mapJob(row: Record<string, unknown>) {
  return {
    id: row.id, uuid: row.uuid, organizationId: row.organization_id, jobType: row.job_type, status: row.status,
    payload: row.payload, result: row.result, errorMessage: row.error_message,
    startedAt: row.started_at, completedAt: row.completed_at, createdAt: row.created_at,
  };
}

export class OperationsService {
  constructor(private readonly repo = new OperationsRepository()) {}

  async getDashboard() {
    const stats = await this.repo.getDashboardStats();
    return stats;
  }

  async getPendingTasks() {
    const tasks = await this.repo.getPendingTasks();
    const totalPending = tasks.failedSettlements + tasks.failedDevices + tasks.syncErrors +
      tasks.pendingGoLive + tasks.pendingKyc + tasks.pendingCompliance + tasks.pendingRisk +
      tasks.pendingApprovals + tasks.retryQueue;
    return { ...tasks, totalPending };
  }

  async getHealth() {
    return this.repo.getHealthStatus();
  }

  async listAlerts(query: AlertListQueryDto) {
    const { items, total } = await this.repo.findAlerts(query);
    return { items: items.map(mapAlert), pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) } };
  }

  async listIncidents(query: IncidentListQueryDto) {
    const { items, total } = await this.repo.findIncidents(query);
    return { items: items.map(mapIncident), pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) } };
  }

  async listRetryQueue(query: RetryListQueryDto) {
    const { items, total } = await this.repo.findRetryQueue(query);
    return { items: items.map(mapRetry), pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) } };
  }

  async listJobs(query: JobListQueryDto) {
    const { items, total } = await this.repo.findJobs(query);
    return { items: items.map(mapJob), pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) } };
  }

  async getFailedPayments() {
    const rows = await this.repo.getFailedPayments();
    return rows.map((r) => ({
      id: r.id, transactionRef: r.transaction_ref, amount: Number(r.amount), currency: r.currency,
      merchantName: r.merchant_name, createdAt: r.created_at,
    }));
  }

  async getFailedPayouts() {
    const rows = await this.repo.getFailedPayouts();
    return rows.map((r) => ({
      id: r.id, payoutRef: r.payout_ref, amount: Number(r.amount), currency: r.currency,
      merchantName: r.merchant_name, createdAt: r.created_at,
    }));
  }

  async getFailedWebhooks() {
    const rows = await this.repo.getFailedWebhooks();
    return rows.map((r) => ({
      id: r.id, uuid: r.uuid, eventType: r.event_type, url: r.url, status: r.status,
      statusCode: r.status_code, attemptCount: r.attempt_count, errorMessage: r.error_message, createdAt: r.created_at,
    }));
  }

  async acknowledgeAlert(id: number, actorId?: number) {
    await this.repo.acknowledgeAlert(id, actorId);
    return { id, status: 'acknowledged' };
  }

  async resolveAlert(id: number) {
    await this.repo.resolveAlert(id);
    return { id, status: 'resolved' };
  }

  async manualRetryQueue(id: number, actorId?: number) {
    const ok = await this.repo.retryQueueItem(id);
    if (!ok) throw new NotFoundError('Retry item not found or max attempts exceeded');
    void auditRecorder.record({
      module: 'operations', categoryCode: 'system', actionCode: 'retry_executed',
      entityType: 'retry_queue', entityId: String(id), description: `Manual retry executed for queue item #${id}.`,
      riskLevel: 'medium', userId: actorId,
    }).catch(() => {});
    return { id, status: 'completed' };
  }

  async manualRetryJob(id: number, actorId?: number) {
    const ok = await this.repo.retryJob(id);
    if (!ok) throw new NotFoundError('Background job not found');
    void auditRecorder.record({
      module: 'operations', categoryCode: 'system', actionCode: 'retry_executed',
      entityType: 'background_job', entityId: String(id), description: `Manual retry executed for job #${id}.`,
      riskLevel: 'medium', userId: actorId,
    }).catch(() => {});
    return { id, status: 'completed' };
  }

  async getQueuesDashboard() {
    const data = await this.repo.getQueuesDashboard();
    return {
      retryQueue: data.retryQueue.map((r) => ({ status: r.status, count: Number(r.cnt) })),
      backgroundJobs: data.backgroundJobs.map((r) => ({ status: r.status, count: Number(r.cnt) })),
      webhookDeliveries: data.webhookDeliveries.map((r) => ({ status: r.status, count: Number(r.cnt) })),
    };
  }

  async getDeadLetterQueue(query: { page: number; pageSize: number }) {
    const { items, total } = await this.repo.getDeadLetterQueue(query);
    return {
      items: items.map((r) => ({
        id: r.id, uuid: r.uuid, webhookId: r.webhook_id, eventType: r.event_type,
        lastError: r.last_error, attemptCount: r.attempt_count, createdAt: r.created_at,
      })),
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) || 1 },
    };
  }

  async getMaintenanceMode() {
    return this.repo.getMaintenanceMode();
  }

  async setMaintenanceMode(enabled: boolean, message?: string, actorId?: number) {
    await this.repo.setMaintenanceMode(enabled, message, actorId);
    return this.repo.getMaintenanceMode();
  }

  async getDeploymentHistory(query: { page: number; pageSize: number }) {
    const { items, total } = await this.repo.getDeploymentHistory(query);
    return {
      items: items.map((r) => ({ id: r.id, uuid: r.uuid, actionCode: r.action_code, description: r.description, createdAt: r.created_at })),
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) || 1 },
    };
  }
}
