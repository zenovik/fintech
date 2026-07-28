import { NotFoundError } from '../../../shared/exceptions/app.exception';
import { ExportFileService } from '../../../shared/services/export-file.service';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { auditRecorder } from '../../audit';
import { AnalyticsRepository, ReportsRepository } from '../repositories/reports.repository';
import {
  AnalyticsQueryDto,
  CreateReportBodyDto,
  CreateScheduledBodyDto,
  ExportQueryDto,
  ExportReportBodyDto,
  HistoryQueryDto,
  ReportListQueryDto,
  RunReportBodyDto,
  UpdateReportBodyDto,
  UpdateScheduledBodyDto,
} from '../dto';
import { MONTH_LABELS } from '../constants/reports.constants';

function parseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try { return JSON.parse(value) as T; } catch { return null; }
}

function mapReport(row: Awaited<ReturnType<ReportsRepository['findById']>>) {
  if (!row) return null;
  return {
    id: row.id,
    uuid: row.uuid,
    name: row.name,
    description: row.description,
    templateId: row.template_id,
    templateName: row.template_name,
    categoryId: row.category_id,
    categoryName: row.category_name,
    status: row.status,
    filters: parseJson<Record<string, unknown>>(row.filters),
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ReportsService {
  constructor(
    private readonly repo = new ReportsRepository(),
    private readonly analyticsRepo = new AnalyticsRepository(),
    private readonly exportFiles = new ExportFileService(),
  ) {}

  async list(query: ReportListQueryDto) {
    const { items, total } = await this.repo.findAll(query);
    return {
      items: items.map((r) => mapReport(r)!),
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) },
    };
  }

  async getById(id: number) {
    const row = await this.repo.findById(id);
    if (!row) throw new NotFoundError('Report not found');
    return mapReport(row);
  }

  async create(dto: CreateReportBodyDto, userId?: number) {
    const id = await this.repo.create(dto, userId);
    return this.getById(id);
  }

  async update(id: number, dto: UpdateReportBodyDto, userId?: number) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Report not found');
    await this.repo.update(id, dto, userId);
    return this.getById(id);
  }

  async delete(id: number) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError('Report not found');
    await this.repo.softDelete(id);
    return { success: true };
  }

  async getTemplates() {
    const rows = await this.repo.findTemplates();
    return rows.map((t) => ({
      id: t.id, uuid: t.uuid, categoryId: t.category_id, categoryName: t.category_name,
      code: t.code, name: t.name, description: t.description, queryType: t.query_type,
      config: parseJson<Record<string, unknown>>(t.config), isSystem: Boolean(t.is_system),
    }));
  }

  async getCategories() {
    const rows = await this.repo.findCategories();
    return rows.map((c) => ({
      id: c.id, uuid: c.uuid, code: c.code, name: c.name, description: c.description, displayOrder: c.display_order,
    }));
  }

  async run(userId: number, dto: RunReportBodyDto) {
    const start = Date.now();
    const logUuid = await this.repo.createExecutionLog(dto.reportId ?? null, userId, 'manual', dto.filters);
    try {
      const period = (dto.filters?.period as string) ?? 'monthly';
      const data = await this.buildReportData(period);
      await this.repo.completeExecutionLog(logUuid, data.rows.length, Date.now() - start);
      return { executionId: logUuid, status: 'completed', data, rowCount: data.rows.length };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Execution failed';
      await this.repo.failExecutionLog(logUuid, msg);
      throw err;
    }
  }

  async export(userId: number, dto: ExportReportBodyDto) {
    const exportId = await this.repo.createExport(userId, dto);
    await this.repo.createExecutionLog(dto.reportId ?? null, userId, 'export', dto.filters);
    const period = (dto.filters?.period as string) ?? 'monthly';
    const data = await this.buildReportData(period);
    const { fileId, rowCount } = await this.exportFiles.writeCsv(
      'report',
      ['Date', 'Revenue', 'Transactions', 'Forecast'],
      data.rows.map((row) => ({
        Date: String(row.date),
        Revenue: row.revenue,
        Transactions: row.transactions,
        Forecast: row.forecast,
      })),
      { userId, permissionCode: PERMISSIONS.REPORTS_EXPORT },
    );
    void auditRecorder.exportReport(String(dto.reportId ?? 'custom'), dto.format, rowCount, { userId }).catch(() => {});
    return {
      exportId,
      status: 'completed',
      format: dto.format,
      rowCount,
      message: 'Report export generated successfully',
      downloadUrl: this.exportFiles.buildDownloadUrl(fileId),
    };
  }

  async getHistory(query: HistoryQueryDto) {
    const { items, total } = await this.repo.findHistory(query);
    return {
      items: items.map((el) => ({
        id: el.id, uuid: el.uuid, reportId: el.report_id, reportName: el.report_name,
        userId: el.user_id, userName: el.user_name, executionType: el.execution_type,
        status: el.status, rowsReturned: el.rows_returned, durationMs: el.duration_ms,
        errorMessage: el.error_message, filterParams: parseJson(el.filter_params),
        startedAt: el.started_at, completedAt: el.completed_at,
      })),
      pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) },
    };
  }

  async getScheduled() {
    const rows = await this.repo.findScheduled();
    return rows.map((s) => ({
      id: s.id, uuid: s.uuid, reportId: s.report_id, reportName: s.report_name,
      name: s.name, cronExpression: s.cron_expression, format: s.format,
      recipients: parseJson<string[]>(s.recipients), filters: parseJson(s.filters),
      isActive: Boolean(s.is_active), lastRunAt: s.last_run_at, nextRunAt: s.next_run_at,
      createdAt: s.created_at,
    }));
  }

  async createScheduled(dto: CreateScheduledBodyDto, userId: number) {
    const id = await this.repo.createScheduled(dto, userId);
    const row = await this.repo.findScheduledById(id);
    if (!row) throw new NotFoundError('Scheduled report not found');
    return {
      id: row.id, uuid: row.uuid, reportId: row.report_id, reportName: row.report_name,
      name: row.name, cronExpression: row.cron_expression, format: row.format,
      isActive: Boolean(row.is_active), nextRunAt: row.next_run_at,
    };
  }

  async updateScheduled(id: number, dto: UpdateScheduledBodyDto) {
    const existing = await this.repo.findScheduledById(id);
    if (!existing) throw new NotFoundError('Scheduled report not found');
    await this.repo.updateScheduled(id, dto);
    return this.getScheduled().then((items) => items.find((s) => s.id === id));
  }

  async deleteScheduled(id: number) {
    const existing = await this.repo.findScheduledById(id);
    if (!existing) throw new NotFoundError('Scheduled report not found');
    await this.repo.softDeleteScheduled(id);
    return { success: true };
  }

  private async buildReportData(period: string) {
    const snapshots = await this.analyticsRepo.getSnapshots('revenue_trend', period as 'monthly');
    const rows = snapshots.map((s) => {
      const data = parseJson<Record<string, number>>(s.data) ?? {};
      return {
        date: s.snapshot_date,
        revenue: data.revenue ?? 0,
        transactions: data.transactions ?? 0,
        forecast: data.forecast ?? 0,
      };
    });
    return { period, rows };
  }
}

export class AnalyticsService {
  constructor(
    private readonly repo = new AnalyticsRepository(),
    private readonly exportFiles = new ExportFileService(),
  ) {}

  async getOverview(query: AnalyticsQueryDto) {
    const kpi = await this.repo.getKpiOverview(query.period);
    const merchantGrowth = await this.repo.getMerchantGrowth(query.period);
    return {
      period: query.period,
      kpis: {
        totalRevenue: { value: Number(kpi?.total_revenue ?? 0), changePct: Number(kpi?.revenue_change_pct ?? 0) },
        totalTransactions: { value: Number(kpi?.total_transactions ?? 0), changePct: Number(kpi?.transactions_change_pct ?? 0) },
        activeMerchants: { value: Number(merchantGrowth?.active ?? 0), new30d: Number(merchantGrowth?.new_30d ?? 0) },
        successRate: { value: Number(kpi?.success_rate ?? 0) },
      },
    };
  }

  async getRevenue(query: AnalyticsQueryDto) {
    const period = query.period ?? 'monthly';
    const snapshots = await this.repo.getSnapshots('revenue_trend', period);
    if (snapshots.length > 0) {
      const actual = snapshots.map((s) => {
        const data = parseJson<Record<string, number>>(s.data);
        return Number(data?.revenue ?? data?.value ?? 0);
      });
      const forecast = snapshots.map((s) => {
        const data = parseJson<Record<string, number>>(s.data);
        const revenue = Number(data?.revenue ?? data?.value ?? 0);
        return Number(data?.forecast ?? revenue * 0.97);
      });
      if (actual.some((value) => value > 0)) {
        return {
          labels: snapshots.map((s) => MONTH_LABELS[new Date(s.snapshot_date).getMonth()]),
          actual,
          forecast,
        };
      }
    }

    const series = await this.repo.getRevenueTimeSeries(period);
    return {
      labels: series.map((row) => MONTH_LABELS[new Date(row.period_date as Date).getMonth()]),
      actual: series.map((row) => Number(row.actual_revenue)),
      forecast: series.map((row) => Number(row.forecast_revenue)),
    };
  }

  async getTransactions(query: AnalyticsQueryDto) {
    const stats = await this.repo.getTransactionStats(query.period);
    const snapshots = await this.repo.getSnapshots('transaction_trend', query.period);
    const trend = snapshots.length
      ? snapshots.map((s) => Number(parseJson<Record<string, number>>(s.data)?.count ?? 0))
      : [Number(stats?.total_count ?? 0)];
    return {
      totalCount: Number(stats?.total_count ?? 0),
      totalVolume: Number(stats?.total_volume ?? 0),
      settledCount: Number(stats?.settled_count ?? 0),
      trend,
    };
  }

  async getSettlements(query: AnalyticsQueryDto) {
    const rows = await this.repo.getSettlementStats(query.period);
    const snapshots = await this.repo.getSnapshots('settlement_trend', 'monthly');
    const snapshotData = parseJson<Record<string, number>>(snapshots[0]?.data ?? null);
    return {
      byStatus: rows.map((r) => ({ status: r.status, count: Number(r.count), volume: Number(r.volume) })),
      summary: snapshotData ?? { processed: 0, pending: 0, volume: 0 },
    };
  }

  async getMerchants(query: AnalyticsQueryDto) {
    const growth = await this.repo.getMerchantGrowth(query.period);
    const topMerchants = await this.repo.getTopMerchants(10);
    const snapshots = await this.repo.getSnapshots('merchant_growth', 'monthly');
    const growthData = parseJson<Record<string, number>>(snapshots[0]?.data ?? null);
    return {
      total: Number(growth?.total ?? 0),
      active: Number(growth?.active ?? 0),
      new30d: Number(growth?.new_30d ?? 0),
      growthPct: growthData?.growthPct ?? 0,
      topMerchants: topMerchants.map((m) => ({
        id: m.id, merchantCode: m.merchant_code, name: m.display_name,
        transactionCount: Number(m.transaction_count), totalVolume: Number(m.total_volume),
      })),
    };
  }

  async getCustomers(query: AnalyticsQueryDto) {
    const stats = await this.repo.getCustomerStats(query.period);
    return {
      uniqueCustomers: Number(stats?.unique_customers ?? 0),
      totalTransactions: Number(stats?.total_transactions ?? 0),
    };
  }

  async getRefunds(query: AnalyticsQueryDto) {
    const stats = await this.repo.getRefundStats(query.period);
    return {
      total: Number(stats?.total ?? 0),
      pending: Number(stats?.pending ?? 0),
      processed: Number(stats?.processed ?? 0),
      processedAmount: Number(stats?.processed_amount ?? 0),
    };
  }

  async getChargebacks(query: AnalyticsQueryDto) {
    const stats = await this.repo.getChargebackStats(query.period);
    return {
      total: Number(stats?.total ?? 0),
      open: Number(stats?.open ?? 0),
      won: Number(stats?.won ?? 0),
      lost: Number(stats?.lost ?? 0),
      wonAmount: Number(stats?.won_amount ?? 0),
      lostAmount: Number(stats?.lost_amount ?? 0),
    };
  }

  async getPayouts(query: AnalyticsQueryDto) {
    const stats = await this.repo.getPayoutStats(query.period);
    return {
      total: Number(stats?.total ?? 0),
      pending: Number(stats?.pending ?? 0),
      confirmed: Number(stats?.confirmed ?? 0),
      failed: Number(stats?.failed ?? 0),
      confirmedAmount: Number(stats?.confirmed_amount ?? 0),
      failedAmount: Number(stats?.failed_amount ?? 0),
    };
  }

  async getPaymentLinks(query: AnalyticsQueryDto) {
    const stats = await this.repo.getPaymentLinkStats(query.period);
    return {
      total: Number(stats?.total ?? 0),
      active: Number(stats?.active ?? 0),
      expired: Number(stats?.expired ?? 0),
      disabled: Number(stats?.disabled ?? 0),
      totalCollected: Number(stats?.total_collected ?? 0),
      totalUsage: Number(stats?.total_usage ?? 0),
      conversionRate: Number(stats?.conversion_rate ?? 0),
    };
  }

  async getInvoices(query: AnalyticsQueryDto) {
    const stats = await this.repo.getInvoiceStats(query.period);
    const revenueByMonth = await this.repo.getInvoiceRevenueByMonth();
    return {
      total: Number(stats?.total ?? 0),
      outstandingCount: Number(stats?.outstanding_count ?? 0),
      paidCount: Number(stats?.paid_count ?? 0),
      overdueCount: Number(stats?.overdue_count ?? 0),
      outstandingAmount: Number(stats?.outstanding_amount ?? 0),
      paidAmount: Number(stats?.paid_amount ?? 0),
      overdueAmount: Number(stats?.overdue_amount ?? 0),
      collectionRate: Number(stats?.collection_rate ?? 0),
      revenueByMonth: revenueByMonth.map((r) => ({
        month: r.month, invoiceCount: Number(r.invoice_count), revenue: Number(r.revenue),
      })),
    };
  }

  async getQrPayments(_query: AnalyticsQueryDto) {
    const stats = await this.repo.getQrPaymentStats();
    return {
      total: Number(stats?.total ?? 0), active: Number(stats?.active ?? 0),
      totalScans: Number(stats?.total_scans ?? 0), totalCollected: Number(stats?.total_collected ?? 0),
    };
  }

  async getSubscriptionsAnalytics(_query: AnalyticsQueryDto) {
    const stats = await this.repo.getSubscriptionAnalyticsStats();
    return {
      total: Number(stats?.total ?? 0), active: Number(stats?.active ?? 0),
      cancelled: Number(stats?.cancelled ?? 0), mrrEstimate: Number(stats?.mrr_estimate ?? 0),
    };
  }

  async getSupportAnalytics(_query: AnalyticsQueryDto) {
    const stats = await this.repo.getSupportAnalyticsStats();
    const closedOrResolved = Number(stats?.closed_or_resolved ?? 0);
    const slaCompliant = Number(stats?.sla_compliant ?? 0);
    return {
      openTickets: Number(stats?.open_tickets ?? 0),
      avgResolutionHours: Number(stats?.avg_resolution_hours ?? 0),
      slaComplianceRate: closedOrResolved > 0 ? Math.round((slaCompliant / closedOrResolved) * 100) : 100,
    };
  }

  async getOperationsAnalytics(_query: AnalyticsQueryDto) {
    const stats = await this.repo.getOperationsAnalyticsStats();
    return {
      failedPaymentCount: Number(stats?.failedPayments ?? 0),
      failedPayoutCount: Number(stats?.failedPayouts ?? 0),
      incidentSummary: { openIncidents: Number(stats?.openIncidents ?? 0) },
    };
  }

  async exportAnalytics(userId: number, query: ExportQueryDto) {
    const reportsRepo = new ReportsRepository();
    const exportId = await reportsRepo.createExport(userId, {
      format: query.format,
      filters: { period: query.period, dateFrom: query.dateFrom, dateTo: query.dateTo },
    });
    const overview = await this.getOverview({ period: query.period ?? 'monthly' });
    const revenue = await this.getRevenue({ period: query.period ?? 'monthly' });
    const rows = [
      { Section: 'Overview', Metric: 'Total Revenue', Value: String(overview.kpis.totalRevenue.value) },
      { Section: 'Overview', Metric: 'Total Transactions', Value: String(overview.kpis.totalTransactions.value) },
      { Section: 'Overview', Metric: 'Active Merchants', Value: String(overview.kpis.activeMerchants.value) },
      { Section: 'Overview', Metric: 'Success Rate', Value: String(overview.kpis.successRate.value) },
      ...revenue.labels.map((label, index) => ({
        Section: 'Revenue',
        Metric: label,
        Value: String(revenue.actual[index] ?? 0),
      })),
    ];
    const { fileId, rowCount } = await this.exportFiles.writeCsv(
      'analytics',
      ['Section', 'Metric', 'Value'],
      rows,
      { userId, permissionCode: PERMISSIONS.ANALYTICS_EXPORT },
    );
    return {
      exportId,
      status: 'completed',
      format: query.format,
      rowCount,
      message: 'Analytics export generated successfully',
      downloadUrl: this.exportFiles.buildDownloadUrl(fileId),
    };
  }

  async getPaymentMethods(query: AnalyticsQueryDto) {
    const rows = await this.repo.getPaymentMethodDistribution(query.period);
    return {
      segments: rows.map((r) => ({
        code: r.code, name: r.name, percentage: Number(r.percentage), amount: Number(r.total_amount),
      })),
    };
  }

  async getRegional(query: AnalyticsQueryDto) {
    const rows = await this.repo.getRegionalDistribution(query.period);
    return {
      regions: rows.map((r) => ({
        code: r.code, name: r.name, volume: Number(r.total_volume), percentage: Number(r.percentage),
      })),
    };
  }
}
