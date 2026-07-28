import { Injectable, inject, signal, computed } from '@angular/core';
import { AuditApiService } from './audit-api.service';
import { AuditLogItem, AuditStats } from '../models/audit.models';
import { DEFAULT_PAGE_SIZE } from '../constants/audit.constants';

type PageState = 'idle' | 'loading' | 'error' | 'empty' | 'ready';

@Injectable()
export class AuditStateService {
  private readonly api = inject(AuditApiService);

  readonly pageState = signal<PageState>('idle');
  readonly errorMessage = signal('');
  readonly logs = signal<AuditLogItem[]>([]);
  readonly stats = signal<AuditStats>({ total: 0, critical24h: 0, recent24h: 0, riskScore: 100 });
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly search = signal('');
  readonly moduleFilter = signal('');
  readonly riskFilter = signal('');
  readonly actionFilter = signal('');
  readonly dateRange = signal('24h');
  readonly liveRefresh = signal(false);

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  loadLogs(): void {
    this.pageState.set('loading');
    this.errorMessage.set('');

    this.api
      .list({
        page: this.page(),
        pageSize: this.pageSize(),
        search: this.search() || undefined,
        module: this.moduleFilter() || undefined,
        riskLevel: this.riskFilter() || undefined,
        actionCode: this.actionFilter() || undefined,
        dateRange: this.dateRange() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.logs.set(res.items);
          this.total.set(res.total);
          this.stats.set(res.stats);
          this.pageState.set(res.items.length === 0 ? 'empty' : 'ready');
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message ?? 'Failed to load audit logs');
          this.pageState.set('error');
        },
      });
  }

  applySearch(term: string): void {
    this.search.set(term);
    this.page.set(1);
    this.loadLogs();
  }

  applyModuleFilter(module: string): void {
    this.moduleFilter.set(module);
    this.page.set(1);
    this.loadLogs();
  }

  applyRiskFilter(risk: string): void {
    this.riskFilter.set(risk);
    this.page.set(1);
    this.loadLogs();
  }

  applyDateRange(range: string): void {
    this.dateRange.set(range);
    this.page.set(1);
    this.loadLogs();
  }

  resetFilters(): void {
    this.search.set('');
    this.moduleFilter.set('');
    this.riskFilter.set('');
    this.actionFilter.set('');
    this.dateRange.set('24h');
    this.page.set(1);
    this.loadLogs();
  }

  goToPage(p: number): void {
    this.page.set(p);
    this.loadLogs();
  }

  toggleLiveRefresh(enabled: boolean): void {
    this.liveRefresh.set(enabled);
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    if (enabled) {
      this.refreshTimer = setInterval(() => this.loadLogs(), 30000);
    }
  }

  exportLogs(): void {
    this.api
      .export({
        search: this.search() || undefined,
        module: this.moduleFilter() || undefined,
        riskLevel: this.riskFilter() || undefined,
        dateRange: this.dateRange() || undefined,
      })
      .subscribe({
        next: (res) => {
          window.open(res.downloadUrl, '_blank');
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message ?? 'Export failed');
        },
      });
  }

  destroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }
}
