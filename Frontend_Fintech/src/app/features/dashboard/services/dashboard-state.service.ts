import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin, catchError, of, map, switchMap } from 'rxjs';
import { DashboardApiService } from './dashboard-api.service';
import { AnalyticsApiService } from '../../reports/services/analytics-api.service';
import { SettlementApiService } from '../../settlements/services/settlement-api.service';
import { NotificationService } from '../../../core/auth/services/notification.service';
import { TokenStorageService } from '../../../core/auth/services/token-storage.service';
import { downloadAuthenticatedExport } from '../../../shared/utils/download.util';
import { DashboardPeriod } from '../constants/dashboard.constants';
import {
  ActivityItem,
  ExecutiveSummary,
  FraudAlertItem,
  HighValueTransactionsData,
  PaymentMethodsData,
  RegionalDistributionData,
  RevenueChartData,
  WidgetState,
} from '../models/dashboard.models';
import { SettlementStatistics } from '../../settlements/models/settlement.models';

@Injectable({ providedIn: 'root' })
export class DashboardStateService {
  private readonly api = inject(DashboardApiService);
  private readonly analyticsApi = inject(AnalyticsApiService);
  private readonly settlementApi = inject(SettlementApiService);
  private readonly notification = inject(NotificationService);
  private readonly tokenStorage = inject(TokenStorageService);

  readonly period = signal<DashboardPeriod>('monthly');
  readonly pageState = signal<WidgetState>('idle');
  readonly errorMessage = signal<string | null>(null);

  readonly summary = signal<ExecutiveSummary | null>(null);
  readonly revenueChart = signal<RevenueChartData | null>(null);
  readonly paymentMethods = signal<PaymentMethodsData | null>(null);
  readonly regionalData = signal<RegionalDistributionData | null>(null);
  readonly activities = signal<ActivityItem[]>([]);
  readonly fraudAlerts = signal<FraudAlertItem[]>([]);
  readonly transactions = signal<HighValueTransactionsData | null>(null);
  readonly settlementStats = signal<SettlementStatistics | null>(null);
  readonly operationsStats = signal<Record<string, number>>({});

  readonly searchQuery = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);

  readonly isEmpty = computed(() => {
    const s = this.summary();
    return s !== null && s.kpis.totalRevenue.value === 0 && s.kpis.totalTransactions.value === 0;
  });

  loadDashboard(): void {
    this.pageState.set('loading');
    this.errorMessage.set(null);
    const period = this.period();

    forkJoin({
      summary: this.api.getSummary(period).pipe(catchError(() => of(null))),
      revenue: this.analyticsApi.getRevenue(period).pipe(
        switchMap((data) => {
          if (data.actual?.length) {
            return of(data);
          }
          return this.api.getRevenueChart().pipe(catchError(() => of(null)));
        }),
        catchError(() => this.api.getRevenueChart().pipe(catchError(() => of(null)))),
      ),
      paymentMethods: this.analyticsApi.getPaymentMethods(period).pipe(
        map((data) => ({
          segments: data.segments.map((s) => ({ code: s.code, name: s.name, percentage: s.percentage, amount: s.amount })),
          dominantLabel: data.segments[0]?.name ?? 'N/A',
        })),
        catchError(() => this.api.getPaymentMethods(period).pipe(catchError(() => of(null)))),
      ),
      regional: this.analyticsApi.getRegional(period).pipe(
        map((data) => ({
          regions: data.regions.map((r) => ({
            code: r.code, name: r.name, volume: r.volume,
            formatted: this.formatCompact(r.volume),
            percentage: r.percentage, progressPct: r.percentage,
          })),
          insight: data.regions[0]
            ? `${data.regions[0].name} leads with ${data.regions[0].percentage.toFixed(1)}% of volume.`
            : 'No regional data available.',
        })),
        catchError(() => this.api.getRegionalDistribution(period).pipe(catchError(() => of(null)))),
      ),
      activities: this.api.getActivities().pipe(catchError(() => of({ items: [] }))),
      fraudAlerts: this.api.getFraudAlerts().pipe(catchError(() => of({ items: [] }))),
      transactions: this.api
        .getHighValueTransactions({
          period,
          page: this.currentPage(),
          pageSize: this.pageSize(),
          search: this.searchQuery() || undefined,
        })
        .pipe(catchError(() => of(null))),
      settlementStats: this.settlementApi.getStatistics().pipe(catchError(() => of(null))),
      operationsStats: this.api.getOperationsStats().pipe(catchError(() => of({}))),
    }).subscribe({
      next: (data) => {
        if (!data.summary && !data.revenue) {
          this.pageState.set('error');
          this.errorMessage.set('Unable to load dashboard data. Our analytics engine is currently experiencing a timeout.');
          return;
        }
        this.summary.set(data.summary);
        this.revenueChart.set(data.revenue);
        this.paymentMethods.set(data.paymentMethods);
        this.regionalData.set(data.regional);
        this.activities.set(data.activities.items);
        this.fraudAlerts.set(data.fraudAlerts.items);
        this.transactions.set(data.transactions);
        this.settlementStats.set(data.settlementStats);
        this.operationsStats.set(data.operationsStats ?? {});
        this.pageState.set(this.isEmpty() ? 'empty' : 'loaded');
      },
      error: () => {
        this.pageState.set('error');
        this.errorMessage.set('Unable to load dashboard data');
      },
    });
  }

  setPeriod(period: DashboardPeriod): void {
    this.period.set(period);
    this.currentPage.set(1);
    this.loadDashboard();
  }

  setPage(page: number): void {
    this.currentPage.set(page);
    this.loadTransactions();
  }

  setPageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadTransactions();
  }

  searchTransactions(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
    this.loadTransactions();
  }

  exportReport(): void {
    this.api.exportReport(this.period(), 'csv').subscribe({
      next: async (res) => {
        const token = this.tokenStorage.getAccessToken();
        if (res.downloadUrl && token) {
          await downloadAuthenticatedExport(res.downloadUrl, token, `dashboard-${Date.now()}.csv`);
        }
        this.notification.success(res.message);
      },
      error: () => this.notification.error('Export failed. Please try again.'),
    });
  }

  retry(): void {
    this.loadDashboard();
  }

  private formatCompact(value: number): string {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  }

  private loadTransactions(): void {
    const period = this.period();
    this.api
      .getHighValueTransactions({
        period,
        page: this.currentPage(),
        pageSize: this.pageSize(),
        search: this.searchQuery() || undefined,
      })
      .subscribe({
        next: (data) => this.transactions.set(data),
        error: () => this.notification.error('Failed to load transactions'),
      });
  }
}
