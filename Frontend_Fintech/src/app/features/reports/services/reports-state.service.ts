import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin, catchError, of } from 'rxjs';
import { ReportsApiService } from './reports-api.service';
import { AnalyticsApiService } from './analytics-api.service';
import { NotificationService } from '../../../core/auth/services/notification.service';
import { TokenStorageService } from '../../../core/auth/services/token-storage.service';
import { downloadAuthenticatedExport } from '../../../shared/utils/download.util';
import { ReportPeriod } from '../constants/reports.constants';
import {
  AnalyticsOverview,
  ExecutionLog,
  PageState,
  ReportItem,
  RevenueChartData,
  ScheduledReport,
  TopMerchant,
} from '../models/reports.models';
import { PaymentSegment, RegionalItem } from '../models/reports.models';

@Injectable({ providedIn: 'root' })
export class ReportsStateService {
  private readonly api = inject(ReportsApiService);
  private readonly analyticsApi = inject(AnalyticsApiService);
  private readonly notification = inject(NotificationService);
  private readonly tokenStorage = inject(TokenStorageService);

  readonly pageState = signal<PageState>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly period = signal<ReportPeriod>('monthly');

  readonly reports = signal<ReportItem[]>([]);
  readonly totalItems = signal(0);
  readonly totalPages = signal(1);
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly searchQuery = signal('');
  readonly statusFilter = signal('');

  readonly overview = signal<AnalyticsOverview | null>(null);
  readonly revenueChart = signal<RevenueChartData | null>(null);
  readonly transactionTrend = signal<number[]>([]);
  readonly settlementData = signal<{ byStatus: { status: string; count: number; volume: number }[]; summary: Record<string, number> } | null>(null);
  readonly topMerchants = signal<TopMerchant[]>([]);
  readonly paymentMethods = signal<PaymentSegment[]>([]);
  readonly regionalData = signal<RegionalItem[]>([]);
  readonly customerStats = signal<{ uniqueCustomers: number; totalTransactions: number } | null>(null);
  readonly executionHistory = signal<ExecutionLog[]>([]);
  readonly scheduledReports = signal<ScheduledReport[]>([]);

  readonly isEmpty = computed(() => this.reports().length === 0 && this.pageState() === 'loaded');
  readonly hasFilters = computed(() => !!this.searchQuery() || !!this.statusFilter());

  loadReports(): void {
    this.pageState.set('loading');
    this.api.list({
      page: this.currentPage(),
      pageSize: this.pageSize(),
      search: this.searchQuery() || undefined,
      status: this.statusFilter() || undefined,
    }).subscribe({
      next: (data) => {
        this.reports.set(data.items);
        this.totalItems.set(data.pagination.total);
        this.totalPages.set(data.pagination.totalPages);
        this.pageState.set(data.items.length ? 'loaded' : 'empty');
      },
      error: () => {
        this.pageState.set('error');
        this.errorMessage.set('Unable to load reports');
      },
    });
  }

  loadAnalytics(): void {
    this.pageState.set('loading');
    const period = this.period();
    forkJoin({
      overview: this.analyticsApi.getOverview(period).pipe(catchError(() => of(null))),
      revenue: this.analyticsApi.getRevenue(period).pipe(catchError(() => of(null))),
      transactions: this.analyticsApi.getTransactions(period).pipe(catchError(() => of(null))),
      settlements: this.analyticsApi.getSettlements(period).pipe(catchError(() => of(null))),
      merchants: this.analyticsApi.getMerchants(period).pipe(catchError(() => of(null))),
      customers: this.analyticsApi.getCustomers(period).pipe(catchError(() => of(null))),
      paymentMethods: this.analyticsApi.getPaymentMethods(period).pipe(catchError(() => of(null))),
      regional: this.analyticsApi.getRegional(period).pipe(catchError(() => of(null))),
    }).subscribe({
      next: (data) => {
        if (!data.overview && !data.revenue) {
          this.pageState.set('error');
          this.errorMessage.set('Unable to load analytics data');
          return;
        }
        this.overview.set(data.overview);
        this.revenueChart.set(data.revenue);
        this.transactionTrend.set(data.transactions?.trend ?? []);
        this.settlementData.set(data.settlements);
        this.topMerchants.set(data.merchants?.topMerchants ?? []);
        this.customerStats.set(data.customers);
        this.paymentMethods.set(data.paymentMethods?.segments ?? []);
        this.regionalData.set(data.regional?.regions ?? []);
        this.pageState.set('loaded');
      },
      error: () => {
        this.pageState.set('error');
        this.errorMessage.set('Unable to load analytics');
      },
    });
  }

  loadHistory(): void {
    this.pageState.set('loading');
    this.api.getHistory({ page: this.currentPage(), pageSize: this.pageSize() }).subscribe({
      next: (data) => {
        this.executionHistory.set(data.items);
        this.totalItems.set(data.pagination.total);
        this.totalPages.set(data.pagination.totalPages);
        this.pageState.set(data.items.length ? 'loaded' : 'empty');
      },
      error: () => { this.pageState.set('error'); this.errorMessage.set('Unable to load history'); },
    });
  }

  loadScheduled(): void {
    this.pageState.set('loading');
    this.api.getScheduled().subscribe({
      next: (items) => {
        this.scheduledReports.set(items);
        this.pageState.set(items.length ? 'loaded' : 'empty');
      },
      error: () => { this.pageState.set('error'); this.errorMessage.set('Unable to load scheduled reports'); },
    });
  }

  exportReport(reportId: number, format: string): void {
    this.api.export({ reportId, format }).subscribe({
      next: async (res) => {
        const token = this.tokenStorage.getAccessToken();
        if (res.downloadUrl && token) {
          await downloadAuthenticatedExport(res.downloadUrl, token, `report-${Date.now()}.csv`);
        }
        this.notification.success(res.message);
      },
      error: () => this.notification.error('Export failed'),
    });
  }

  exportAnalytics(format: string): void {
    this.analyticsApi.export(format, this.period()).subscribe({
      next: async (res) => {
        const token = this.tokenStorage.getAccessToken();
        if (res.downloadUrl && token) {
          await downloadAuthenticatedExport(res.downloadUrl, token, `analytics-${Date.now()}.csv`);
        }
        this.notification.success(res.message);
      },
      error: () => this.notification.error('Export failed'),
    });
  }

  runReport(reportId: number): void {
    this.api.run({ reportId, filters: { period: this.period() } }).subscribe({
      next: () => this.notification.success('Report executed successfully'),
      error: () => this.notification.error('Report execution failed'),
    });
  }

  deleteReport(id: number): void {
    this.api.delete(id).subscribe({
      next: () => { this.notification.success('Report deleted'); this.loadReports(); },
      error: () => this.notification.error('Delete failed'),
    });
  }

  setPeriod(period: ReportPeriod): void {
    this.period.set(period);
    this.loadAnalytics();
  }

  applySearch(search: string): void {
    this.searchQuery.set(search);
    this.currentPage.set(1);
    this.loadReports();
  }

  setPage(page: number): void {
    this.currentPage.set(page);
    this.loadReports();
  }

  retry(): void {
    this.loadReports();
  }

  retryAnalytics(): void {
    this.loadAnalytics();
  }
}
