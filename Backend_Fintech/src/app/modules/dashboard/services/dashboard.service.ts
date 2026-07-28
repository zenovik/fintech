import { DashboardRepository } from '../repositories/dashboard.repository';
import { ExportFileService } from '../../../shared/services/export-file.service';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import {
  ActivitiesResponse,
  ExecutiveSummaryResponse,
  FraudAlertsResponse,
  HighValueTransactionsResponse,
  PaymentMethodsResponse,
  RegionalDistributionResponse,
  RevenueChartResponse,
  UserPreferencesResponse,
} from '../types/dashboard.types';
import {
  DashboardPeriodType,
  HIGH_VALUE_THRESHOLD_DEFAULT,
  MONTH_LABELS,
  PERIOD_DAYS,
} from '../constants/dashboard.constants';
import { NotFoundError } from '../../../shared/exceptions/app.exception';
import { cacheService } from '../../../shared/services/cache.service';
import {
  ExportBodyDto,
  HighValueTransactionsQueryDto,
  PeriodQueryDto,
  PreferencesBodyDto,
} from '../dto';

export class DashboardService {
  constructor(
    private readonly repo = new DashboardRepository(),
    private readonly exportFiles = new ExportFileService(),
  ) {}

  async getSummary(query: PeriodQueryDto): Promise<ExecutiveSummaryResponse> {
    const period = query.period ?? 'monthly';
    const snapshot = await cacheService.getOrSet(
      `dashboard:kpi:${period}`,
      () => this.repo.getKpiSnapshot(period),
      { cacheKey: 'dashboard_kpi', fallbackTtlSeconds: 120 },
    );

    if (!snapshot) {
      return this.emptySummary(period);
    }

    const { from, to } = this.getPeriodRange(period);
    return {
      period: { type: period, from, to },
      kpis: {
        totalRevenue: {
          value: Number(snapshot.total_revenue),
          currency: 'USD',
          formatted: this.formatCompact(Number(snapshot.total_revenue)),
          changePct: snapshot.revenue_change_pct ? Number(snapshot.revenue_change_pct) : null,
          trend: this.getTrend(snapshot.revenue_change_pct),
        },
        totalTransactions: {
          value: snapshot.total_transactions,
          changePct: snapshot.transactions_change_pct ? Number(snapshot.transactions_change_pct) : null,
          trend: this.getTrend(snapshot.transactions_change_pct),
        },
        totalMerchants: {
          value: snapshot.total_merchants,
          changePct: snapshot.merchants_change_pct ? Number(snapshot.merchants_change_pct) : null,
          trend: this.getTrend(snapshot.merchants_change_pct),
        },
        successRate: {
          value: Number(snapshot.success_rate),
          target: 99.9,
          status: Number(snapshot.success_rate) >= 99.5 ? 'optimal' : Number(snapshot.success_rate) >= 98 ? 'warning' : 'critical',
        },
      },
    };
  }

  async getRevenueChart(): Promise<RevenueChartResponse> {
    const rows = await this.repo.getRevenueSeries();
    return {
      labels: rows.map((r) => MONTH_LABELS[new Date(r.period_date).getMonth()]),
      actual: rows.map((r) => Number(r.actual_revenue)),
      forecast: rows.map((r) => Number(r.forecast_revenue)),
    };
  }

  async getPaymentMethods(query: PeriodQueryDto): Promise<PaymentMethodsResponse> {
    const period = query.period ?? 'monthly';
    const rows = await this.repo.getPaymentMethods(period);
    const segments = rows.map((r) => ({
      code: r.code,
      name: r.name,
      percentage: Number(r.percentage),
      amount: Number(r.total_amount),
    }));
    return {
      segments,
      dominantLabel: segments[0]?.name ?? 'N/A',
    };
  }

  async getRegionalDistribution(query: PeriodQueryDto): Promise<RegionalDistributionResponse> {
    const period = query.period ?? 'monthly';
    const rows = await this.repo.getRegionalDistribution(period);
    const regions = rows.map((r) => ({
      code: r.code,
      name: r.name,
      volume: Number(r.total_volume),
      formatted: this.formatCompact(Number(r.total_volume)),
      percentage: Number(r.percentage),
      progressPct: Number(r.progress_pct),
    }));
    const top = regions[0];
    return {
      regions,
      insight: top
        ? `${top.name} remains the leading region with ${top.percentage.toFixed(1)}% of total volume.`
        : 'No regional data available for this period.',
    };
  }

  async getHighValueTransactions(query: HighValueTransactionsQueryDto): Promise<HighValueTransactionsResponse> {
    const period = query.period ?? 'monthly';
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const minAmount = query.minAmount ?? HIGH_VALUE_THRESHOLD_DEFAULT;

    let total = await this.repo.countHighValueTransactions(period, query.search, query.status, minAmount, true);
    let rows = total > 0
      ? await this.repo.getHighValueTransactions(period, page, pageSize, query.search, query.status, minAmount, true)
      : [];

    if (total === 0) {
      total = await this.repo.countHighValueTransactions(period, query.search, query.status, minAmount, false);
      rows = await this.repo.getHighValueTransactions(period, page, pageSize, query.search, query.status, minAmount, false);
    }

    return {
      items: rows.map((r) => ({
        uuid: r.uuid,
        transactionRef: r.transaction_ref,
        merchant: {
          code: r.merchant_code,
          name: r.display_name,
          initials: r.logo_initials ?? r.display_name.slice(0, 2).toUpperCase(),
          color: r.logo_color,
        },
        amount: Number(r.amount),
        currency: r.currency,
        formattedAmount: this.formatCurrency(Number(r.amount), r.currency),
        processedAt: r.processed_at.toISOString(),
        paymentMethod: { label: r.payment_method_detail, iconKey: r.payment_icon_key },
        status: { code: r.status_code, label: r.status_label, badgeColor: r.badge_color },
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async getActivities(): Promise<ActivitiesResponse> {
    const rows = await this.repo.getActivities(10);
    return {
      items: rows.map((r) => ({
        uuid: r.uuid,
        title: r.title,
        description: r.description,
        iconKey: r.icon_key,
        colorToken: r.color_token,
        occurredAt: r.occurred_at.toISOString(),
        relativeTime: this.relativeTime(r.occurred_at),
      })),
    };
  }

  async getFraudAlerts(): Promise<FraudAlertsResponse> {
    const rows = await this.repo.getFraudAlerts();
    return {
      items: rows.map((r) => ({
        uuid: r.uuid,
        title: r.title,
        message: r.message,
        severity: r.severity_code,
      })),
    };
  }

  async getPreferences(userId: number): Promise<UserPreferencesResponse> {
    const row = await this.repo.getUserPreferences(userId);
    if (!row) {
      return {
        defaultDateRange: 'monthly',
        customDateFrom: null,
        customDateTo: null,
        highValueThreshold: HIGH_VALUE_THRESHOLD_DEFAULT,
        tablePageSize: 10,
      };
    }
    return {
      defaultDateRange: row.default_date_range,
      customDateFrom: row.custom_date_from ? row.custom_date_from.toISOString().slice(0, 10) : null,
      customDateTo: row.custom_date_to ? row.custom_date_to.toISOString().slice(0, 10) : null,
      highValueThreshold: Number(row.high_value_threshold),
      tablePageSize: row.table_page_size,
    };
  }

  async updatePreferences(userId: number, body: PreferencesBodyDto): Promise<UserPreferencesResponse> {
    await this.repo.upsertUserPreferences(userId, {
      defaultDateRange: body.defaultDateRange,
      customDateFrom: body.customDateFrom,
      customDateTo: body.customDateTo,
      highValueThreshold: body.highValueThreshold,
      tablePageSize: body.tablePageSize,
    });
    return this.getPreferences(userId);
  }

  async createExport(userId: number, body: ExportBodyDto): Promise<{ jobId: string; status: string; message: string; downloadUrl: string; rowCount: number }> {
    const formatId = await this.repo.getExportFormatId(body.format);
    if (!formatId) throw new NotFoundError('Export format not found');

    const jobId = await this.repo.createExportJob(userId, formatId, {
      period: body.period,
      sections: body.sections ?? ['summary', 'revenue', 'transactions'],
    });

    const summary = await this.getSummary({ period: body.period ?? 'monthly' });
    const revenue = await this.getRevenueChart();
    const rows = [
      { Section: 'Summary', Metric: 'Total Revenue', Value: summary.kpis.totalRevenue.formatted },
      { Section: 'Summary', Metric: 'Total Transactions', Value: String(summary.kpis.totalTransactions.value) },
      { Section: 'Summary', Metric: 'Total Merchants', Value: String(summary.kpis.totalMerchants.value) },
      { Section: 'Summary', Metric: 'Success Rate', Value: `${summary.kpis.successRate.value}%` },
      ...revenue.labels.map((label, index) => ({
        Section: 'Revenue',
        Metric: label,
        Value: String(revenue.actual[index] ?? 0),
      })),
    ];
    const { fileId, rowCount } = await this.exportFiles.writeCsv(
      'dashboard',
      ['Section', 'Metric', 'Value'],
      rows,
      { userId, permissionCode: PERMISSIONS.DASHBOARD_EXPORT },
    );

    return {
      jobId,
      status: 'completed',
      message: 'Export report generated successfully',
      downloadUrl: this.exportFiles.buildDownloadUrl(fileId),
      rowCount,
    };
  }

  private emptySummary(period: DashboardPeriodType): ExecutiveSummaryResponse {
    const { from, to } = this.getPeriodRange(period);
    return {
      period: { type: period, from, to },
      kpis: {
        totalRevenue: { value: 0, currency: 'USD', formatted: '$0.00', changePct: null, trend: 'flat' },
        totalTransactions: { value: 0, changePct: null, trend: 'flat' },
        totalMerchants: { value: 0, changePct: null, trend: 'flat' },
        successRate: { value: 0, target: 99.9, status: 'warning' },
      },
    };
  }

  private getPeriodRange(period: DashboardPeriodType): { from: string; to: string } {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - PERIOD_DAYS[period]);
    return { from: from.toISOString(), to: to.toISOString() };
  }

  private getTrend(value: string | null): 'up' | 'down' | 'flat' {
    if (value === null) return 'flat';
    const n = Number(value);
    if (n > 0) return 'up';
    if (n < 0) return 'down';
    return 'flat';
  }

  private formatCompact(value: number): string {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value.toFixed(2)}`;
  }

  private formatCurrency(value: number, currency: string): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
  }

  private relativeTime(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} mins ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return days === 1 ? 'Yesterday' : `${days} days ago`;
  }
}
