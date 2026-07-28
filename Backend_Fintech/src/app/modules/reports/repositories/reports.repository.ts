import { randomUUID } from 'crypto';
import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../../database';
import { getOrganizationId } from '../../../shared/context/org-context';
import { periodDateClause, periodFallbackChain } from '../../../shared/helpers/period-filter.helper';
import {
  CreateReportBodyDto,
  CreateScheduledBodyDto,
  ExportReportBodyDto,
  HistoryQueryDto,
  ReportListQueryDto,
  UpdateReportBodyDto,
  UpdateScheduledBodyDto,
} from '../dto';
import {
  AnalyticsSnapshotRow,
  ReportCategoryRow,
  ReportExecutionLogRow,
  ReportExportRow,
  ReportRow,
  ReportTemplateRow,
  ScheduledReportRow,
  TopMerchantRow,
} from '../types/reports.types';
import { PeriodType } from '../constants/reports.constants';

export class ReportsRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async findCategories(): Promise<ReportCategoryRow[]> {
    const [rows] = await this.pool.query<ReportCategoryRow[]>(
      `SELECT id, uuid, code, name, description, display_order
       FROM report_categories WHERE deleted_at IS NULL ORDER BY display_order`,
    );
    return rows;
  }

  async findTemplates(): Promise<ReportTemplateRow[]> {
    const [rows] = await this.pool.query<ReportTemplateRow[]>(
      `SELECT t.id, t.uuid, t.category_id, c.name AS category_name, t.code, t.name,
              t.description, t.query_type, t.config, t.is_system
       FROM report_templates t
       JOIN report_categories c ON c.id = t.category_id AND c.deleted_at IS NULL
       WHERE t.deleted_at IS NULL ORDER BY c.display_order, t.name`,
    );
    return rows;
  }

  async findAll(query: ReportListQueryDto): Promise<{ items: ReportRow[]; total: number }> {
    const params: unknown[] = [];
    let clause = ' WHERE r.deleted_at IS NULL';
    if (query.search) {
      clause += ' AND (r.name LIKE ? OR r.description LIKE ?)';
      const term = `%${query.search}%`;
      params.push(term, term);
    }
    if (query.status) {
      clause += ' AND r.status = ?';
      params.push(query.status);
    }
    if (query.categoryId) {
      clause += ' AND r.category_id = ?';
      params.push(query.categoryId);
    }
    const sortCol = ['name', 'created_at', 'status'].includes(query.sortBy) ? query.sortBy : 'created_at';
    const order = query.sortOrder === 'asc' ? 'ASC' : 'DESC';
    const offset = (query.page - 1) * query.pageSize;

    const [countRows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM reports r ${clause}`,
      params,
    );
    const total = Number(countRows[0]?.total ?? 0);

    const [rows] = await this.pool.query<ReportRow[]>(
      `SELECT r.id, r.uuid, r.name, r.description, r.template_id, t.name AS template_name,
              r.category_id, c.name AS category_name, r.status, r.filters,
              r.created_by, CONCAT(u.first_name, ' ', u.last_name) AS created_by_name,
              r.created_at, r.updated_at
       FROM reports r
       LEFT JOIN report_templates t ON t.id = r.template_id
       LEFT JOIN report_categories c ON c.id = r.category_id
       LEFT JOIN users u ON u.id = r.created_by
       ${clause}
       ORDER BY r.${sortCol} ${order}
       LIMIT ? OFFSET ?`,
      [...params, query.pageSize, offset],
    );
    return { items: rows, total };
  }

  async findById(id: number): Promise<ReportRow | null> {
    const [rows] = await this.pool.query<ReportRow[]>(
      `SELECT r.id, r.uuid, r.name, r.description, r.template_id, t.name AS template_name,
              r.category_id, c.name AS category_name, r.status, r.filters,
              r.created_by, CONCAT(u.first_name, ' ', u.last_name) AS created_by_name,
              r.created_at, r.updated_at
       FROM reports r
       LEFT JOIN report_templates t ON t.id = r.template_id
       LEFT JOIN report_categories c ON c.id = r.category_id
       LEFT JOIN users u ON u.id = r.created_by
       WHERE r.id = ? AND r.deleted_at IS NULL`,
      [id],
    );
    return rows[0] ?? null;
  }

  async create(dto: CreateReportBodyDto, userId?: number): Promise<number> {
    const uuid = randomUUID();
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO reports (uuid, name, description, template_id, category_id, status, filters, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuid, dto.name, dto.description ?? null, dto.templateId ?? null, dto.categoryId ?? null,
        dto.status ?? 'active', dto.filters ? JSON.stringify(dto.filters) : null, userId ?? null, userId ?? null,
      ],
    );
    return result.insertId;
  }

  async update(id: number, dto: UpdateReportBodyDto, userId?: number): Promise<void> {
    const fields: string[] = [];
    const params: unknown[] = [];
    if (dto.name !== undefined) { fields.push('name = ?'); params.push(dto.name); }
    if (dto.description !== undefined) { fields.push('description = ?'); params.push(dto.description); }
    if (dto.templateId !== undefined) { fields.push('template_id = ?'); params.push(dto.templateId); }
    if (dto.categoryId !== undefined) { fields.push('category_id = ?'); params.push(dto.categoryId); }
    if (dto.status !== undefined) { fields.push('status = ?'); params.push(dto.status); }
    if (dto.filters !== undefined) { fields.push('filters = ?'); params.push(JSON.stringify(dto.filters)); }
    if (!fields.length) return;
    fields.push('updated_by = ?');
    params.push(userId ?? null);
    params.push(id);
    await this.pool.query(`UPDATE reports SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`, params);
  }

  async softDelete(id: number): Promise<void> {
    await this.pool.query('UPDATE reports SET deleted_at = NOW(), status = ? WHERE id = ?', ['archived', id]);
  }

  async createExecutionLog(reportId: number | null, userId: number, type: string, filters?: Record<string, unknown>): Promise<string> {
    const uuid = randomUUID();
    await this.pool.query(
      `INSERT INTO report_execution_logs (uuid, report_id, user_id, execution_type, status, filter_params, started_at)
       VALUES (?, ?, ?, ?, 'running', ?, NOW())`,
      [uuid, reportId, userId, type, filters ? JSON.stringify(filters) : null],
    );
    return uuid;
  }

  async completeExecutionLog(uuid: string, rows: number, durationMs: number): Promise<void> {
    await this.pool.query(
      `UPDATE report_execution_logs SET status = 'completed', rows_returned = ?, duration_ms = ?, completed_at = NOW()
       WHERE uuid = ?`,
      [rows, durationMs, uuid],
    );
  }

  async failExecutionLog(uuid: string, error: string): Promise<void> {
    await this.pool.query(
      `UPDATE report_execution_logs SET status = 'failed', error_message = ?, completed_at = NOW() WHERE uuid = ?`,
      [error, uuid],
    );
  }

  async createExport(userId: number, dto: ExportReportBodyDto): Promise<string> {
    const uuid = randomUUID();
    const ext = dto.format;
    const fileName = `report-export-${Date.now()}.${ext}`;
    await this.pool.query(
      `INSERT INTO report_exports (uuid, user_id, report_id, format, status, file_url, file_name, row_count, filter_params, completed_at)
       VALUES (?, ?, ?, ?, 'completed', ?, ?, ?, ?, NOW())`,
      [
        uuid, userId, dto.reportId ?? null, dto.format,
        `/exports/reports/${fileName}`, fileName, 0,
        dto.filters ? JSON.stringify(dto.filters) : null,
      ],
    );
    return uuid;
  }

  async findHistory(query: HistoryQueryDto): Promise<{ items: ReportExecutionLogRow[]; total: number }> {
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM report_execution_logs');
    const total = Number(countRows[0]?.total ?? 0);
    const [rows] = await this.pool.query<ReportExecutionLogRow[]>(
      `SELECT el.id, el.uuid, el.report_id, r.name AS report_name, el.user_id,
              CONCAT(u.first_name, ' ', u.last_name) AS user_name,
              el.execution_type, el.status, el.rows_returned, el.duration_ms,
              el.error_message, el.filter_params, el.started_at, el.completed_at
       FROM report_execution_logs el
       LEFT JOIN reports r ON r.id = el.report_id
       LEFT JOIN users u ON u.id = el.user_id
       ORDER BY el.started_at DESC LIMIT ? OFFSET ?`,
      [query.pageSize, offset],
    );
    return { items: rows, total };
  }

  async findExportHistory(query: HistoryQueryDto): Promise<{ items: ReportExportRow[]; total: number }> {
    const offset = (query.page - 1) * query.pageSize;
    const [countRows] = await this.pool.query<RowDataPacket[]>('SELECT COUNT(*) AS total FROM report_exports WHERE deleted_at IS NULL');
    const total = Number(countRows[0]?.total ?? 0);
    const [rows] = await this.pool.query<ReportExportRow[]>(
      `SELECT e.id, e.uuid, e.user_id, e.report_id, r.name AS report_name, e.format, e.status,
              e.file_url, e.file_name, e.row_count, e.filter_params, e.completed_at, e.created_at
       FROM report_exports e
       LEFT JOIN reports r ON r.id = e.report_id
       WHERE e.deleted_at IS NULL
       ORDER BY e.created_at DESC LIMIT ? OFFSET ?`,
      [query.pageSize, offset],
    );
    return { items: rows, total };
  }

  async findScheduled(): Promise<ScheduledReportRow[]> {
    const [rows] = await this.pool.query<ScheduledReportRow[]>(
      `SELECT s.id, s.uuid, s.report_id, r.name AS report_name, s.user_id, s.name,
              s.cron_expression, s.format, s.recipients, s.filters, s.is_active,
              s.last_run_at, s.next_run_at, s.created_at
       FROM scheduled_reports s
       JOIN reports r ON r.id = s.report_id AND r.deleted_at IS NULL
       WHERE s.deleted_at IS NULL ORDER BY s.next_run_at ASC`,
    );
    return rows;
  }

  async findScheduledById(id: number): Promise<ScheduledReportRow | null> {
    const [rows] = await this.pool.query<ScheduledReportRow[]>(
      `SELECT s.id, s.uuid, s.report_id, r.name AS report_name, s.user_id, s.name,
              s.cron_expression, s.format, s.recipients, s.filters, s.is_active,
              s.last_run_at, s.next_run_at, s.created_at
       FROM scheduled_reports s
       JOIN reports r ON r.id = s.report_id
       WHERE s.id = ? AND s.deleted_at IS NULL`,
      [id],
    );
    return rows[0] ?? null;
  }

  async createScheduled(dto: CreateScheduledBodyDto, userId: number): Promise<number> {
    const uuid = randomUUID();
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO scheduled_reports (uuid, report_id, user_id, name, cron_expression, format, recipients, filters, is_active, next_run_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 DAY), ?)`,
      [
        uuid, dto.reportId, userId, dto.name, dto.cronExpression, dto.format,
        dto.recipients ? JSON.stringify(dto.recipients) : null,
        dto.filters ? JSON.stringify(dto.filters) : null,
        dto.isActive ? 1 : 0, userId,
      ],
    );
    return result.insertId;
  }

  async updateScheduled(id: number, dto: UpdateScheduledBodyDto): Promise<void> {
    const fields: string[] = [];
    const params: unknown[] = [];
    if (dto.name !== undefined) { fields.push('name = ?'); params.push(dto.name); }
    if (dto.cronExpression !== undefined) { fields.push('cron_expression = ?'); params.push(dto.cronExpression); }
    if (dto.format !== undefined) { fields.push('format = ?'); params.push(dto.format); }
    if (dto.recipients !== undefined) { fields.push('recipients = ?'); params.push(JSON.stringify(dto.recipients)); }
    if (dto.filters !== undefined) { fields.push('filters = ?'); params.push(JSON.stringify(dto.filters)); }
    if (dto.isActive !== undefined) { fields.push('is_active = ?'); params.push(dto.isActive ? 1 : 0); }
    if (dto.reportId !== undefined) { fields.push('report_id = ?'); params.push(dto.reportId); }
    if (!fields.length) return;
    params.push(id);
    await this.pool.query(`UPDATE scheduled_reports SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`, params);
  }

  async softDeleteScheduled(id: number): Promise<void> {
    await this.pool.query('UPDATE scheduled_reports SET deleted_at = NOW(), is_active = 0 WHERE id = ?', [id]);
  }
}

export class AnalyticsRepository {
  constructor(private readonly pool: Pool = getPool()) {}

  async getSnapshots(metricGroup: string, period: PeriodType = 'monthly'): Promise<AnalyticsSnapshotRow[]> {
    for (const candidate of periodFallbackChain(period)) {
      const [rows] = await this.pool.query<AnalyticsSnapshotRow[]>(
        `SELECT snapshot_date, period_type, metric_group, data
         FROM analytics_snapshots
         WHERE metric_group = ? AND period_type = ?
         ORDER BY snapshot_date ASC`,
        [metricGroup, candidate],
      );
      if (rows.length > 0) {
        return rows;
      }
    }
    return [];
  }

  async getRevenueTimeSeries(period: PeriodType = 'monthly'): Promise<RowDataPacket[]> {
    for (const candidate of periodFallbackChain(period)) {
      const candidateGranularity =
        candidate === 'monthly' ? 'month' : candidate === 'weekly' ? 'week' : 'day';
      const [rows] = await this.pool.query<RowDataPacket[]>(
        `SELECT period_date, actual_revenue, forecast_revenue
         FROM revenue_time_series
         WHERE period_type = ? AND granularity = ?
         ORDER BY period_date ASC
         LIMIT 12`,
        [candidate, candidateGranularity],
      );
      if (rows.length > 0) {
        return rows;
      }
    }
    return [];
  }

  async getKpiOverview(period: PeriodType) {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT total_revenue, total_transactions, total_merchants, success_rate,
              revenue_change_pct, transactions_change_pct, merchants_change_pct
       FROM dashboard_kpi_snapshots
       WHERE period_type = ? AND snapshot_date <= CURDATE()
       ORDER BY snapshot_date DESC LIMIT 1`,
      [period],
    );
    return rows[0] ?? null;
  }

  async getTopMerchants(limit = 10): Promise<TopMerchantRow[]> {
    const orgId = getOrganizationId();
    const orgClause = orgId ? ' AND m.organization_id = ?' : '';
    const params: unknown[] = orgId ? [orgId, limit] : [limit];
    const [rows] = await this.pool.query<TopMerchantRow[]>(
      `SELECT m.id, m.merchant_code, m.display_name,
              COUNT(t.id) AS transaction_count, COALESCE(SUM(t.amount), 0) AS total_volume
       FROM merchants m
       LEFT JOIN transactions t ON t.merchant_id = m.id AND t.deleted_at IS NULL
       WHERE m.deleted_at IS NULL AND m.status = 'active'${orgClause}
       GROUP BY m.id, m.merchant_code, m.display_name
       ORDER BY total_volume DESC LIMIT ?`,
      params,
    );
    return rows;
  }

  async getTransactionStats(period: PeriodType) {
    const periodFilter = periodDateClause('t.processed_at', period);
    const orgId = getOrganizationId();
    const orgClause = orgId ? ' AND m.organization_id = ?' : '';
    const params = [...periodFilter.params, ...(orgId ? [orgId] : [])];
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total_count, COALESCE(SUM(t.amount), 0) AS total_volume,
              SUM(CASE WHEN ts.code = 'settled' THEN 1 ELSE 0 END) AS settled_count
       FROM transactions t
       JOIN merchants m ON m.id = t.merchant_id AND m.deleted_at IS NULL
       JOIN transaction_statuses ts ON ts.id = t.status_id
       WHERE t.deleted_at IS NULL${periodFilter.clause}${orgClause}`,
      params,
    );
    return rows[0];
  }

  async getSettlementStats(period: PeriodType = 'monthly') {
    const periodFilter = periodDateClause('s.created_at', period);
    const orgId = getOrganizationId();
    const orgClause = orgId ? ' AND m.organization_id = ?' : '';
    const params = [...periodFilter.params, ...(orgId ? [orgId] : [])];
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT s.status, COUNT(*) AS count, COALESCE(SUM(s.amount), 0) AS volume
       FROM settlements s
       JOIN merchants m ON m.id = s.merchant_id
       WHERE s.deleted_at IS NULL${periodFilter.clause}${orgClause}
       GROUP BY s.status`,
      params,
    );
    return rows;
  }

  async getMerchantGrowth(period: PeriodType = 'monthly') {
    const periodFilter = periodDateClause('onboarded_at', period);
    const orgId = getOrganizationId();
    const params = [...periodFilter.params, ...(orgId ? [orgId] : [])];
    const orgClause = orgId ? ' AND organization_id = ?' : '';
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
              SUM(CASE WHEN onboarded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS new_30d
       FROM merchants WHERE deleted_at IS NULL${periodFilter.clause}${orgClause}`,
      params,
    );
    return rows[0];
  }

  async getCustomerStats(period: PeriodType = 'monthly') {
    const customerPeriod = periodDateClause('created_at', period);
    const txPeriod = periodDateClause('t.processed_at', period);
    const orgId = getOrganizationId();
    const orgCustomerClause = orgId ? ' AND organization_id = ?' : '';
    const orgTxClause = orgId ? ' AND m.organization_id = ?' : '';
    const customerParams = [...customerPeriod.params, ...(orgId ? [orgId] : [])];
    const txParams = [...txPeriod.params, ...(orgId ? [orgId] : [])];
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT (SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL${customerPeriod.clause}${orgCustomerClause}) AS unique_customers,
              (SELECT COUNT(*) FROM transactions t
               JOIN merchants m ON m.id = t.merchant_id
               WHERE t.deleted_at IS NULL${txPeriod.clause}${orgTxClause}) AS total_transactions`,
      [...customerParams, ...txParams],
    );
    return rows[0];
  }

  async getRefundStats(period: PeriodType = 'monthly') {
    const periodFilter = periodDateClause('r.created_at', period);
    const orgId = getOrganizationId();
    const orgClause = orgId ? ' AND m.organization_id = ?' : '';
    const params = [...periodFilter.params, ...(orgId ? [orgId] : [])];
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN r.status = 'pending' THEN 1 ELSE 0 END) AS pending,
              SUM(CASE WHEN r.status = 'processed' THEN 1 ELSE 0 END) AS processed,
              COALESCE(SUM(CASE WHEN r.status = 'processed' THEN r.amount ELSE 0 END), 0) AS processed_amount
       FROM transaction_refunds r
       JOIN merchants m ON m.id = r.merchant_id
       WHERE r.deleted_at IS NULL${periodFilter.clause}${orgClause}`,
      params,
    );
    return rows[0];
  }

  async getChargebackStats(period: PeriodType = 'monthly') {
    const periodFilter = periodDateClause('d.created_at', period);
    const orgId = getOrganizationId();
    const orgClause = orgId ? ' AND m.organization_id = ?' : '';
    const params = [...periodFilter.params, ...(orgId ? [orgId] : [])];
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN d.status IN ('open', 'evidence_required', 'under_review', 'representment_submitted') THEN 1 ELSE 0 END) AS open,
              SUM(CASE WHEN d.status = 'won' THEN 1 ELSE 0 END) AS won,
              SUM(CASE WHEN d.status = 'lost' THEN 1 ELSE 0 END) AS lost,
              COALESCE(SUM(CASE WHEN d.status = 'lost' THEN d.amount ELSE 0 END), 0) AS lost_amount,
              COALESCE(SUM(CASE WHEN d.status = 'won' THEN d.amount ELSE 0 END), 0) AS won_amount
       FROM transaction_disputes d
       JOIN merchants m ON m.id = d.merchant_id
       WHERE d.deleted_at IS NULL${periodFilter.clause}${orgClause}`,
      params,
    );
    return rows[0];
  }

  async getPayoutStats(period: PeriodType = 'monthly') {
    const periodFilter = periodDateClause('p.created_at', period);
    const orgId = getOrganizationId();
    const orgClause = orgId ? ' AND m.organization_id = ?' : '';
    const params = [...periodFilter.params, ...(orgId ? [orgId] : [])];
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN p.status IN ('pending', 'scheduled', 'processing', 'sent') THEN 1 ELSE 0 END) AS pending,
              SUM(CASE WHEN p.status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed,
              SUM(CASE WHEN p.status = 'failed' THEN 1 ELSE 0 END) AS failed,
              COALESCE(SUM(CASE WHEN p.status = 'confirmed' THEN p.amount ELSE 0 END), 0) AS confirmed_amount,
              COALESCE(SUM(CASE WHEN p.status = 'failed' THEN p.amount ELSE 0 END), 0) AS failed_amount
       FROM payouts p
       JOIN merchants m ON m.id = p.merchant_id
       WHERE p.deleted_at IS NULL${periodFilter.clause}${orgClause}`,
      params,
    );
    return rows[0];
  }

  async getPaymentLinkStats(period: PeriodType = 'monthly') {
    const periodFilter = periodDateClause('pl.created_at', period);
    const orgId = getOrganizationId();
    const orgClause = orgId ? ' AND pl.organization_id = ?' : '';
    const params = [...periodFilter.params, ...(orgId ? [orgId] : [])];
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN pl.status = 'active' THEN 1 ELSE 0 END) AS active,
              SUM(CASE WHEN pl.status = 'expired' THEN 1 ELSE 0 END) AS expired,
              SUM(CASE WHEN pl.status = 'disabled' THEN 1 ELSE 0 END) AS disabled,
              COALESCE(SUM(
                (SELECT COALESCE(SUM(plt.paid_amount), 0) FROM payment_link_transactions plt WHERE plt.payment_link_id = pl.id)
              ), 0) AS total_collected,
              COALESCE(SUM(pl.current_usage), 0) AS total_usage,
              CASE WHEN COALESCE(SUM(pl.max_usage), 0) > 0
                THEN ROUND(COALESCE(SUM(pl.current_usage), 0) / SUM(pl.max_usage) * 100, 2)
                ELSE 0 END AS conversion_rate
       FROM payment_links pl
       WHERE pl.deleted_at IS NULL${periodFilter.clause}${orgClause}`,
      params,
    );
    return rows[0];
  }

  async getInvoiceStats(period: PeriodType = 'monthly') {
    const periodFilter = periodDateClause('i.issue_date', period);
    const orgId = getOrganizationId();
    const orgClause = orgId ? ' AND i.organization_id = ?' : '';
    const params = [...periodFilter.params, ...(orgId ? [orgId] : [])];
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN i.status IN ('sent','viewed','partially_paid','overdue') THEN 1 ELSE 0 END) AS outstanding_count,
              SUM(CASE WHEN i.status = 'paid' THEN 1 ELSE 0 END) AS paid_count,
              SUM(CASE WHEN i.status = 'overdue' THEN 1 ELSE 0 END) AS overdue_count,
              COALESCE(SUM(CASE WHEN i.status IN ('sent','viewed','partially_paid','overdue') THEN i.balance_due ELSE 0 END), 0) AS outstanding_amount,
              COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.amount_paid ELSE 0 END), 0) AS paid_amount,
              COALESCE(SUM(CASE WHEN i.status = 'overdue' THEN i.balance_due ELSE 0 END), 0) AS overdue_amount,
              CASE WHEN COALESCE(SUM(i.total), 0) > 0
                THEN ROUND(COALESCE(SUM(i.amount_paid), 0) / SUM(i.total) * 100, 2)
                ELSE 0 END AS collection_rate
       FROM invoices i
       WHERE i.deleted_at IS NULL${periodFilter.clause}${orgClause}`,
      params,
    );
    return rows[0];
  }

  async getInvoiceRevenueByMonth(periodMonths = 12) {
    const orgId = getOrganizationId();
    const orgClause = orgId ? ' AND i.organization_id = ?' : '';
    const params = orgId ? [periodMonths, orgId] : [periodMonths];
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(i.paid_at, '%Y-%m') AS month,
              COUNT(*) AS invoice_count,
              COALESCE(SUM(i.amount_paid), 0) AS revenue
       FROM invoices i
       WHERE i.deleted_at IS NULL AND i.status = 'paid' AND i.paid_at IS NOT NULL
         AND i.paid_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)${orgClause}
       GROUP BY DATE_FORMAT(i.paid_at, '%Y-%m')
       ORDER BY month ASC`,
      params,
    );
    return rows;
  }

  async getQrPaymentStats() {
    const orgId = getOrganizationId();
    const orgClause = orgId ? ' AND q.organization_id = ?' : '';
    const params = orgId ? [orgId] : [];
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN q.status = 'active' THEN 1 ELSE 0 END) AS active,
              COALESCE(SUM(q.scan_count), 0) AS total_scans,
              COALESCE((SELECT SUM(qt.paid_amount) FROM qr_transactions qt JOIN qr_codes qx ON qx.id = qt.qr_code_id WHERE qx.deleted_at IS NULL), 0) AS total_collected
       FROM qr_codes q WHERE q.deleted_at IS NULL${orgClause}`, params,
    );
    return rows[0];
  }

  async getSubscriptionAnalyticsStats() {
    const orgId = getOrganizationId();
    const orgClause = orgId ? ' AND s.organization_id = ?' : '';
    const params = orgId ? [orgId] : [];
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN s.status = 'active' THEN 1 ELSE 0 END) AS active,
              SUM(CASE WHEN s.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
              COALESCE(SUM(sp.price), 0) AS mrr_estimate
       FROM subscriptions s JOIN subscription_plans sp ON sp.id = s.plan_id
       WHERE s.deleted_at IS NULL${orgClause}`, params,
    );
    return rows[0];
  }

  async getSupportAnalyticsStats() {
    const orgId = getOrganizationId();
    const orgClause = orgId ? ' AND organization_id = ?' : '';
    const params = orgId ? [orgId] : [];
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT SUM(CASE WHEN status IN ('open','assigned','in_progress','waiting_customer') THEN 1 ELSE 0 END) AS open_tickets,
              AVG(CASE WHEN resolved_at IS NOT NULL THEN TIMESTAMPDIFF(HOUR, created_at, resolved_at) END) AS avg_resolution_hours,
              SUM(CASE WHEN sla_breached = 0 AND (resolved_at IS NOT NULL OR status IN ('open','assigned','in_progress','waiting_customer')) THEN 1 ELSE 0 END) AS sla_compliant,
              SUM(CASE WHEN resolved_at IS NOT NULL OR status IN ('closed','cancelled') THEN 1 ELSE 0 END) AS closed_or_resolved
       FROM support_tickets WHERE deleted_at IS NULL${orgClause}`, params,
    );
    return rows[0];
  }

  async getOperationsAnalyticsStats() {
    const orgId = getOrganizationId();
    const payParams: unknown[] = [];
    let payOrg = '';
    if (orgId) { payOrg = ' AND m.organization_id = ?'; payParams.push(orgId); }
    const [failedPay] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM transactions t JOIN transaction_statuses ts ON ts.id = t.status_id
       JOIN merchants m ON m.id = t.merchant_id WHERE ts.code = 'failed' AND t.deleted_at IS NULL${payOrg}`, payParams,
    );
    const payoutParams: unknown[] = [];
    let payoutOrg = '';
    if (orgId) { payoutOrg = ' AND m.organization_id = ?'; payoutParams.push(orgId); }
    const [failedPayout] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS cnt FROM payouts p JOIN merchants m ON m.id = p.merchant_id
       WHERE p.status = 'failed' AND p.deleted_at IS NULL${payoutOrg}`, payoutParams,
    );
    const [incidents] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS open_incidents FROM operations_incidents WHERE status IN ('open','investigating')`,
    );
    return { failedPayments: Number(failedPay[0]?.cnt ?? 0), failedPayouts: Number(failedPayout[0]?.cnt ?? 0), openIncidents: Number(incidents[0]?.open_incidents ?? 0) };
  }

  async getPaymentMethodDistribution(period: PeriodType) {
    for (const candidate of periodFallbackChain(period)) {
      const [rows] = await this.pool.query<RowDataPacket[]>(
        `SELECT pmt.code, pmt.name, pmd.percentage, pmd.total_amount
         FROM payment_method_distribution pmd
         JOIN payment_method_types pmt ON pmt.id = pmd.payment_method_type_id
         WHERE pmd.period_type = ? AND pmd.snapshot_date <= CURDATE()
           AND pmd.snapshot_date = (
             SELECT MAX(snapshot_date) FROM payment_method_distribution WHERE period_type = ?
           )
         ORDER BY pmd.percentage DESC`,
        [candidate, candidate],
      );
      if (rows.length > 0) {
        return rows;
      }
    }
    return [];
  }

  async getRegionalDistribution(period: PeriodType) {
    for (const candidate of periodFallbackChain(period)) {
      const [rows] = await this.pool.query<RowDataPacket[]>(
        `SELECT r.code, r.name, rd.total_volume, rd.percentage
         FROM regional_distribution rd
         JOIN regions r ON r.id = rd.region_id
         WHERE rd.period_type = ? AND rd.snapshot_date <= CURDATE()
           AND rd.snapshot_date = (
             SELECT MAX(snapshot_date) FROM regional_distribution WHERE period_type = ?
           )
         ORDER BY rd.total_volume DESC`,
        [candidate, candidate],
      );
      if (rows.length > 0) {
        return rows;
      }
    }
    return [];
  }
}
