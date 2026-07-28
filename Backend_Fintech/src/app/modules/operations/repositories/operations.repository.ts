import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { getOrganizationId } from '../../../shared/context/org-context';
import { processBackgroundJob, processRetryQueueItem } from '../../../shared/workers/job-handlers';
import { AlertListQueryDto, IncidentListQueryDto, JobListQueryDto, RetryListQueryDto } from '../dto';

export class OperationsRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  private orgFilter(alias: string, params: unknown[]): string {
    const orgId = getOrganizationId();
    if (orgId) { params.push(orgId); return ` AND (${alias}.organization_id = ? OR ${alias}.organization_id IS NULL)`; }
    return '';
  }

  async getDashboardStats() {
    const orgId = getOrganizationId();
    const orgParams: unknown[] = [];
    const ticketOrg = orgId ? ' AND organization_id = ?' : '';
    const ticketParams = orgId ? [orgId] : [];

    const [tickets] = await this.pool.query<RowDataPacket[]>(
      `SELECT SUM(CASE WHEN status IN ('open','assigned','in_progress','waiting_customer') THEN 1 ELSE 0 END) AS open_tickets
       FROM support_tickets WHERE deleted_at IS NULL${ticketOrg}`, ticketParams,
    );
    const [alerts] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS active_alerts FROM system_alerts WHERE status = 'active'`,
    );
    const [incidents] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS open_incidents FROM operations_incidents WHERE status IN ('open','investigating')`,
    );
    const [retry] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS pending_retries FROM retry_queue WHERE status IN ('pending','failed')`,
    );
    const [jobs] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS running_jobs FROM background_jobs WHERE status IN ('queued','running')`,
    );

    const failedPayments = await this.getFailedPaymentCount(orgId);
    const failedPayouts = await this.getFailedPayoutCount(orgId);
    const failedWebhooks = await this.getFailedWebhookCount();

    return {
      openTickets: Number(tickets[0]?.open_tickets ?? 0),
      activeAlerts: Number(alerts[0]?.active_alerts ?? 0),
      openIncidents: Number(incidents[0]?.open_incidents ?? 0),
      pendingRetries: Number(retry[0]?.pending_retries ?? 0),
      runningJobs: Number(jobs[0]?.running_jobs ?? 0),
      failedPayments, failedPayouts, failedWebhooks,
    };
  }

  async getFailedPaymentCount(orgId?: number | null) {
    const params: unknown[] = [];
    let orgClause = '';
    if (orgId) { orgClause = ' AND m.organization_id = ?'; params.push(orgId); }
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM transactions t
       JOIN transaction_statuses ts ON ts.id = t.status_id
       JOIN merchants m ON m.id = t.merchant_id
       WHERE ts.code = 'failed' AND t.deleted_at IS NULL${orgClause}`, params,
    );
    return Number(rows[0]?.cnt ?? 0);
  }

  async getFailedPayoutCount(orgId?: number | null) {
    const params: unknown[] = [];
    let orgClause = '';
    if (orgId) { orgClause = ' AND m.organization_id = ?'; params.push(orgId); }
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM payouts p JOIN merchants m ON m.id = p.merchant_id
       WHERE p.status = 'failed' AND p.deleted_at IS NULL${orgClause}`, params,
    );
    return Number(rows[0]?.cnt ?? 0);
  }

  async getFailedWebhookCount() {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM webhook_logs WHERE status = 'failed'`,
    );
    return Number(rows[0]?.cnt ?? 0);
  }

  async findAlerts(query: AlertListQueryDto) {
    const { page, pageSize, status, severity } = query;
    const conds: string[] = [];
    const p: unknown[] = [];
    const orgClause = this.orgFilter('a', p);
    if (status) { conds.push('a.status = ?'); p.push(status); }
    if (severity) { conds.push('a.severity = ?'); p.push(severity); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}${orgClause}` : (orgClause ? `WHERE 1=1${orgClause}` : '');
    const offset = (page - 1) * pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM system_alerts a ${where}`, p);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT a.* FROM system_alerts a ${where} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`, [...p, pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async findIncidents(query: IncidentListQueryDto) {
    const { page, pageSize, status, severity } = query;
    const conds: string[] = [];
    const p: unknown[] = [];
    const orgClause = this.orgFilter('i', p);
    if (status) { conds.push('i.status = ?'); p.push(status); }
    if (severity) { conds.push('i.severity = ?'); p.push(severity); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}${orgClause}` : (orgClause ? `WHERE 1=1${orgClause}` : '');
    const offset = (page - 1) * pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM operations_incidents i ${where}`, p);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT i.* FROM operations_incidents i ${where} ORDER BY i.created_at DESC LIMIT ? OFFSET ?`, [...p, pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async findRetryQueue(query: RetryListQueryDto) {
    const { page, pageSize, status, entityType } = query;
    const conds: string[] = [];
    const p: unknown[] = [];
    const orgClause = this.orgFilter('r', p);
    if (status) { conds.push('r.status = ?'); p.push(status); }
    if (entityType) { conds.push('r.entity_type = ?'); p.push(entityType); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}${orgClause}` : (orgClause ? `WHERE 1=1${orgClause}` : '');
    const offset = (page - 1) * pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM retry_queue r ${where}`, p);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT r.* FROM retry_queue r ${where} ORDER BY r.scheduled_at ASC LIMIT ? OFFSET ?`, [...p, pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async findJobs(query: JobListQueryDto) {
    const { page, pageSize, status, jobType } = query;
    const conds: string[] = [];
    const p: unknown[] = [];
    const orgClause = this.orgFilter('j', p);
    if (status) { conds.push('j.status = ?'); p.push(status); }
    if (jobType) { conds.push('j.job_type = ?'); p.push(jobType); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}${orgClause}` : (orgClause ? `WHERE 1=1${orgClause}` : '');
    const offset = (page - 1) * pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM background_jobs j ${where}`, p);
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT j.* FROM background_jobs j ${where} ORDER BY j.created_at DESC LIMIT ? OFFSET ?`, [...p, pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async getFailedPayments(limit = 20) {
    const params: unknown[] = [];
    const orgClause = this.orgFilter('m', params).replace('m.', 'm.');
    const orgId = getOrganizationId();
    let where = `WHERE ts.code = 'failed' AND t.deleted_at IS NULL`;
    if (orgId) { where += ' AND m.organization_id = ?'; params.unshift(orgId); }
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT t.id, t.transaction_ref, t.amount, t.currency, t.created_at, m.display_name AS merchant_name
       FROM transactions t
       JOIN transaction_statuses ts ON ts.id = t.status_id
       JOIN merchants m ON m.id = t.merchant_id
       ${where} ORDER BY t.created_at DESC LIMIT ?`, [...params, limit],
    );
    return rows;
  }

  async getFailedPayouts(limit = 20) {
    const params: unknown[] = [];
    let where = `WHERE p.status = 'failed' AND p.deleted_at IS NULL`;
    const orgId = getOrganizationId();
    if (orgId) { where += ' AND m.organization_id = ?'; params.push(orgId); }
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT p.id, p.payout_ref, p.amount, p.currency, p.created_at, m.display_name AS merchant_name
       FROM payouts p JOIN merchants m ON m.id = p.merchant_id
       ${where} ORDER BY p.created_at DESC LIMIT ?`, [...params, limit],
    );
    return rows;
  }

  async getFailedWebhooks(limit = 20) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id, uuid, event_type, url, status, status_code, attempt_count, error_message, created_at
       FROM webhook_logs WHERE status = 'failed' ORDER BY created_at DESC LIMIT ?`, [limit],
    );
    return rows;
  }

  async acknowledgeAlert(id: number, userId?: number) {
    await this.pool.query(
      `UPDATE system_alerts SET status = 'acknowledged', acknowledged_by = ?, acknowledged_at = NOW() WHERE id = ?`,
      [userId ?? null, id],
    );
  }

  async resolveAlert(id: number) {
    await this.pool.query(`UPDATE system_alerts SET status = 'resolved', resolved_at = NOW() WHERE id = ?`, [id]);
  }

  async retryQueueItem(id: number): Promise<boolean> {
    const result = await processRetryQueueItem(id, this.pool);
    return result.success;
  }

  async retryJob(id: number): Promise<boolean> {
    const result = await processBackgroundJob(id, this.pool);
    return result.success;
  }

  async getHealthStatus() {
    try {
      await this.pool.query('SELECT 1');
      return { database: 'healthy', api: 'healthy', timestamp: new Date().toISOString() };
    } catch {
      return { database: 'unhealthy', api: 'healthy', timestamp: new Date().toISOString() };
    }
  }

  async getPendingTasks() {
    const orgId = getOrganizationId();
    const orgClause = orgId ? ' AND organization_id = ?' : '';

    const [coreCounts] = await this.pool.query<RowDataPacket[]>(
      `SELECT
         (SELECT COUNT(*) FROM settlements WHERE status = 'failed' AND deleted_at IS NULL) AS failedSettlements,
         (SELECT COUNT(*) FROM payment_devices WHERE health_status IN ('critical','offline') AND deleted_at IS NULL${orgClause}) AS failedDevices,
         (SELECT COUNT(*) FROM device_sync_logs WHERE sync_status = 'failed' AND synced_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) AS syncErrors,
         (SELECT COUNT(*) FROM merchant_onboarding_applications WHERE onboarding_status = 'go_live'${orgClause}) AS pendingGoLive,
         (SELECT COUNT(*) FROM merchant_onboarding_kyc_documents WHERE verification_status = 'pending') AS pendingKyc,
         (SELECT COUNT(*) FROM retry_queue WHERE status IN ('pending','failed')) AS retryQueue`,
      orgId ? [orgId, orgId] : [],
    );

    const [workflowCounts] = await this.pool.query<RowDataPacket[]>(
      `SELECT sd.code, COUNT(*) AS cnt
       FROM onboarding_workflow_instances wi
       JOIN onboarding_workflow_stage_definitions sd ON sd.id = wi.current_stage_id
       WHERE sd.code IN ('compliance_review','risk_review','business_review')
         AND wi.workflow_status IN ('pending','in_progress','overdue')
       GROUP BY sd.code`,
    );

    const workflowMap = Object.fromEntries(workflowCounts.map((r) => [String(r.code), Number(r.cnt ?? 0)]));

    return {
      failedSettlements: Number(coreCounts[0]?.failedSettlements ?? 0),
      failedDevices: Number(coreCounts[0]?.failedDevices ?? 0),
      syncErrors: Number(coreCounts[0]?.syncErrors ?? 0),
      pendingGoLive: Number(coreCounts[0]?.pendingGoLive ?? 0),
      pendingKyc: Number(coreCounts[0]?.pendingKyc ?? 0),
      pendingCompliance: workflowMap.compliance_review ?? 0,
      pendingRisk: workflowMap.risk_review ?? 0,
      pendingApprovals: workflowMap.business_review ?? 0,
      retryQueue: Number(coreCounts[0]?.retryQueue ?? 0),
    };
  }

  async getQueuesDashboard() {
    const [retry] = await this.pool.query<RowDataPacket[]>(
      `SELECT status, COUNT(*) AS cnt FROM retry_queue GROUP BY status`,
    );
    const [jobs] = await this.pool.query<RowDataPacket[]>(
      `SELECT status, COUNT(*) AS cnt FROM background_jobs GROUP BY status`,
    );
    const [webhooks] = await this.pool.query<RowDataPacket[]>(
      `SELECT status, COUNT(*) AS cnt FROM webhook_delivery_queue GROUP BY status`,
    );
    return { retryQueue: retry, backgroundJobs: jobs, webhookDeliveries: webhooks };
  }

  async getDeadLetterQueue(query: { page: number; pageSize: number }) {
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM webhook_delivery_queue WHERE status = 'dead_letter'`,
    );
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT * FROM webhook_delivery_queue WHERE status = 'dead_letter' ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }

  async getMaintenanceMode() {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT config_key, config_value FROM platform_configurations WHERE config_key IN ('maintenance_mode','maintenance_message')`,
    );
    const config: Record<string, string> = {};
    for (const r of rows) config[r.config_key as string] = r.config_value as string;
    return { enabled: config.maintenance_mode === 'true', message: config.maintenance_message ?? null };
  }

  async setMaintenanceMode(enabled: boolean, message?: string, actorId?: number): Promise<void> {
    void actorId;
    await this.pool.query(
      `INSERT INTO platform_configurations (config_key, config_value) VALUES ('maintenance_mode', ?)
       ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)`,
      [enabled ? 'true' : 'false'],
    );
    if (message != null) {
      await this.pool.query(
        `INSERT INTO platform_configurations (config_key, config_value) VALUES ('maintenance_message', ?)
         ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)`, [message],
      );
    }
  }

  async getDeploymentHistory(query: { page: number; pageSize: number }) {
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM audit_logs WHERE action_code = 'deployment' OR category_code = 'deployment'`,
    );
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id, uuid, action_code, description, created_at FROM audit_logs
       WHERE action_code = 'deployment' OR category_code = 'deployment'
       ORDER BY created_at DESC LIMIT ? OFFSET ?`, [query.pageSize, offset],
    );
    return { items: rows, total: Number(countRows[0]?.total ?? 0) };
  }
}
