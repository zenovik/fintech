import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SettlementApiService } from './settlement-api.service';
import { NotificationService } from '../../../core/auth/services/notification.service';
import { TokenStorageService } from '../../../core/auth/services/token-storage.service';
import { DEFAULT_PAGE_SIZE, SettlementPageState, SettlementStatus } from '../constants/settlement.constants';
import { SettlementBatch, SettlementDetail, SettlementListItem, SettlementStatistics } from '../models/settlement.models';
import { downloadAuthenticatedExport } from '../../../shared/utils/download.util';

@Injectable({ providedIn: 'root' })
export class SettlementStateService {
  private readonly api = inject(SettlementApiService);
  private readonly notification = inject(NotificationService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly router = inject(Router);

  readonly pageState = signal<SettlementPageState>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly settlements = signal<SettlementListItem[]>([]);
  readonly statistics = signal<SettlementStatistics | null>(null);
  readonly selectedSettlement = signal<SettlementDetail | null>(null);
  readonly batches = signal<SettlementBatch[]>([]);
  readonly selectedBatch = signal<(SettlementBatch & { settlements: SettlementListItem[] }) | null>(null);
  readonly batchPageState = signal<SettlementPageState>('idle');
  readonly batchStatusFilter = signal('');
  readonly batchCurrentPage = signal(1);
  readonly batchPageSize = signal(DEFAULT_PAGE_SIZE);

  readonly filteredBatches = computed(() => {
    const status = this.batchStatusFilter();
    const items = this.batches();
    if (!status) return items;
    if (status === 'processed') return items.filter((b) => b.status === 'completed' || b.status === 'processed');
    return items.filter((b) => b.status === status);
  });

  readonly batchTotalItems = computed(() => this.filteredBatches().length);
  readonly batchTotalPages = computed(() => Math.max(1, Math.ceil(this.batchTotalItems() / this.batchPageSize())));
  readonly paginatedBatches = computed(() => {
    const start = (this.batchCurrentPage() - 1) * this.batchPageSize();
    return this.filteredBatches().slice(start, start + this.batchPageSize());
  });
  readonly isBatchEmpty = computed(() => this.batchPageState() === 'loaded' && this.filteredBatches().length === 0);

  readonly searchQuery = signal('');
  readonly statusFilter = signal<SettlementStatus | ''>('');
  readonly merchantIdFilter = signal<number | null>(null);
  readonly dateFromFilter = signal('');
  readonly dateToFilter = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly totalItems = signal(0);
  readonly totalPages = signal(0);

  readonly isEmpty = computed(() => this.pageState() === 'loaded' && this.settlements().length === 0);
  readonly hasFilters = computed(() => !!this.searchQuery() || !!this.statusFilter() || !!this.merchantIdFilter() || !!this.dateFromFilter() || !!this.dateToFilter());

  loadSettlements(): void {
    this.pageState.set('loading');
    this.errorMessage.set(null);
    this.api.list({
      page: this.currentPage(), pageSize: this.pageSize(),
      search: this.searchQuery() || undefined,
      status: this.statusFilter() || undefined,
      merchantId: this.merchantIdFilter() ?? undefined,
      dateFrom: this.dateFromFilter() || undefined,
      dateTo: this.dateToFilter() || undefined,
    }).subscribe({
      next: (data) => {
        this.settlements.set(data.items);
        this.totalItems.set(data.pagination.total);
        this.totalPages.set(data.pagination.totalPages);
        this.pageState.set(data.items.length === 0 ? 'empty' : 'loaded');
      },
      error: () => { this.pageState.set('error'); this.errorMessage.set('Unable to load settlements.'); },
    });
  }

  loadStatistics(): void {
    this.api.getStatistics({ merchantId: this.merchantIdFilter() ?? undefined }).subscribe({
      next: (s) => this.statistics.set(s), error: () => {},
    });
  }

  loadSettlementDetail(id: number): void {
    this.pageState.set('loading');
    this.api.getById(id).subscribe({
      next: (s) => { this.selectedSettlement.set(s); this.pageState.set('loaded'); },
      error: () => { this.pageState.set('error'); this.errorMessage.set('Settlement not found.'); },
    });
  }

  loadBatches(): void {
    this.batchPageState.set('loading');
    this.errorMessage.set(null);
    this.api.getBatches().subscribe({
      next: (d) => {
        this.batches.set(d.items);
        this.batchPageState.set(d.items.length === 0 ? 'empty' : 'loaded');
      },
      error: () => {
        this.batches.set([]);
        this.batchPageState.set('error');
        this.errorMessage.set('Unable to load settlement batches.');
      },
    });
  }

  applyBatchStatusFilter(status: string): void {
    this.batchStatusFilter.set(status);
    this.batchCurrentPage.set(1);
  }

  setBatchPage(page: number): void {
    this.batchCurrentPage.set(page);
  }

  setBatchPageSize(size: number): void {
    this.batchPageSize.set(size);
    this.batchCurrentPage.set(1);
  }

  loadBatchDetail(id: number): void {
    this.pageState.set('loading');
    this.api.getBatchById(id).subscribe({
      next: (b) => { this.selectedBatch.set(b); this.pageState.set('loaded'); },
      error: () => { this.pageState.set('error'); this.errorMessage.set('Batch not found.'); },
    });
  }

  loadForMerchant(merchantId: number): void {
    this.merchantIdFilter.set(merchantId);
    this.currentPage.set(1);
    this.loadSettlements();
  }

  applySearch(q: string): void { this.searchQuery.set(q); this.currentPage.set(1); this.loadSettlements(); }
  applyFilters(f: { status?: SettlementStatus | ''; merchantId?: number | null; dateFrom?: string; dateTo?: string }): void {
    if (f.status !== undefined) this.statusFilter.set(f.status);
    if (f.merchantId !== undefined) this.merchantIdFilter.set(f.merchantId);
    if (f.dateFrom !== undefined) this.dateFromFilter.set(f.dateFrom);
    if (f.dateTo !== undefined) this.dateToFilter.set(f.dateTo);
    this.currentPage.set(1);
    this.loadSettlements();
  }
  clearFilters(): void {
    this.searchQuery.set(''); this.statusFilter.set(''); this.merchantIdFilter.set(null);
    this.dateFromFilter.set(''); this.dateToFilter.set(''); this.currentPage.set(1); this.loadSettlements();
  }
  setPage(p: number): void { this.currentPage.set(p); this.loadSettlements(); }
  setPageSize(s: number): void { this.pageSize.set(s); this.currentPage.set(1); this.loadSettlements(); }
  retry(): void {
    if (this.selectedSettlement()) this.loadSettlementDetail(this.selectedSettlement()!.id);
    else if (this.selectedBatch()) this.loadBatchDetail(this.selectedBatch()!.id);
    else if (this.batches().length || this.batchPageState() !== 'idle') this.loadBatches();
    else this.loadSettlements();
  }
  exportSettlements(format = 'csv'): void {
    this.api.export({ format, status: this.statusFilter() || undefined, merchantId: this.merchantIdFilter() ?? undefined }).subscribe({
      next: async (r) => {
        const token = this.tokenStorage.getAccessToken();
        if (r.downloadUrl && token) {
          await downloadAuthenticatedExport(r.downloadUrl, token, `settlements-${Date.now()}.csv`);
        }
        this.notification.success(r.message);
      },
      error: () => this.notification.error('Export failed'),
    });
  }
  processReversal(id: number, amount: number, reason: string): void {
    this.api.reversal(id, amount, reason).subscribe({
      next: () => { this.notification.success('Reversal processed'); this.loadSettlementDetail(id); },
      error: () => this.notification.error('Reversal failed'),
    });
  }
}
