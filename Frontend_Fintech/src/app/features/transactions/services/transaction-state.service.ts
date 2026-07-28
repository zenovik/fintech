import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TransactionApiService } from './transaction-api.service';
import { NotificationService } from '../../../core/auth/services/notification.service';
import { TokenStorageService } from '../../../core/auth/services/token-storage.service';
import { downloadAuthenticatedExport } from '../../../shared/utils/download.util';
import {
  DEFAULT_PAGE_SIZE,
  HIGH_VALUE_THRESHOLD,
  TransactionPageState,
  TransactionPeriod,
  TransactionStatus,
} from '../constants/transaction.constants';
import { TransactionDetail, TransactionListItem, TransactionStatistics } from '../models/transaction.models';

@Injectable({ providedIn: 'root' })
export class TransactionStateService {
  private readonly api = inject(TransactionApiService);
  private readonly notification = inject(NotificationService);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly router = inject(Router);

  readonly pageState = signal<TransactionPageState>('idle');
  readonly errorMessage = signal<string | null>(null);

  readonly transactions = signal<TransactionListItem[]>([]);
  readonly statistics = signal<TransactionStatistics | null>(null);
  readonly selectedTransaction = signal<TransactionDetail | null>(null);

  readonly searchQuery = signal('');
  readonly statusFilter = signal<TransactionStatus | ''>('');
  readonly merchantIdFilter = signal<number | null>(null);
  readonly dateFromFilter = signal('');
  readonly dateToFilter = signal('');
  readonly minAmountFilter = signal<number | null>(null);
  readonly maxAmountFilter = signal<number | null>(null);
  readonly isHighValueFilter = signal(false);
  readonly periodFilter = signal<TransactionPeriod | ''>('');

  readonly currentPage = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly totalItems = signal(0);
  readonly totalPages = signal(0);

  readonly isEmpty = computed(() => this.pageState() === 'loaded' && this.transactions().length === 0);
  readonly hasFilters = computed(
    () =>
      !!this.searchQuery() ||
      !!this.statusFilter() ||
      !!this.merchantIdFilter() ||
      !!this.dateFromFilter() ||
      !!this.dateToFilter() ||
      this.minAmountFilter() !== null ||
      this.maxAmountFilter() !== null ||
      this.isHighValueFilter(),
  );

  loadTransactions(): void {
    this.pageState.set('loading');
    this.errorMessage.set(null);

    this.api
      .list({
        page: this.currentPage(),
        pageSize: this.pageSize(),
        search: this.searchQuery() || undefined,
        status: this.statusFilter() || undefined,
        merchantId: this.merchantIdFilter() ?? undefined,
        dateFrom: this.dateFromFilter() || undefined,
        dateTo: this.dateToFilter() || undefined,
        minAmount: this.minAmountFilter() ?? undefined,
        maxAmount: this.maxAmountFilter() ?? undefined,
        isHighValue: this.isHighValueFilter() || undefined,
        period: this.periodFilter() || undefined,
      })
      .subscribe({
        next: (data) => {
          this.transactions.set(data.items);
          this.totalItems.set(data.pagination.total);
          this.totalPages.set(data.pagination.totalPages);
          this.pageState.set(data.items.length === 0 ? 'empty' : 'loaded');
        },
        error: () => {
          this.pageState.set('error');
          this.errorMessage.set('Unable to load transactions. Please try again.');
        },
      });
  }

  loadStatistics(): void {
    this.api
      .getStatistics({
        period: this.periodFilter() || undefined,
        merchantId: this.merchantIdFilter() ?? undefined,
      })
      .subscribe({ next: (s) => this.statistics.set(s), error: () => {} });
  }

  loadTransactionDetail(id: number): void {
    this.pageState.set('loading');
    this.errorMessage.set(null);
    this.api.getById(id).subscribe({
      next: (tx) => {
        this.selectedTransaction.set(tx);
        this.pageState.set('loaded');
      },
      error: () => {
        this.pageState.set('error');
        this.errorMessage.set('Transaction not found or unavailable.');
      },
    });
  }

  loadForMerchant(merchantId: number, page = 1, pageSize = 5): void {
    this.merchantIdFilter.set(merchantId);
    this.currentPage.set(page);
    this.pageSize.set(pageSize);
    this.loadTransactions();
  }

  loadHighValueForDashboard(period: TransactionPeriod, page: number, pageSize: number, search?: string): void {
    this.periodFilter.set(period);
    this.isHighValueFilter.set(true);
    this.minAmountFilter.set(HIGH_VALUE_THRESHOLD);
    this.searchQuery.set(search ?? '');
    this.currentPage.set(page);
    this.pageSize.set(pageSize);
    this.loadTransactions();
  }

  applySearch(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
    this.loadTransactions();
  }

  applyFilters(filters: {
    status?: TransactionStatus | '';
    merchantId?: number | null;
    dateFrom?: string;
    dateTo?: string;
    minAmount?: number | null;
    maxAmount?: number | null;
    isHighValue?: boolean;
  }): void {
    if (filters.status !== undefined) this.statusFilter.set(filters.status);
    if (filters.merchantId !== undefined) this.merchantIdFilter.set(filters.merchantId);
    if (filters.dateFrom !== undefined) this.dateFromFilter.set(filters.dateFrom);
    if (filters.dateTo !== undefined) this.dateToFilter.set(filters.dateTo);
    if (filters.minAmount !== undefined) this.minAmountFilter.set(filters.minAmount);
    if (filters.maxAmount !== undefined) this.maxAmountFilter.set(filters.maxAmount);
    if (filters.isHighValue !== undefined) this.isHighValueFilter.set(filters.isHighValue);
    this.currentPage.set(1);
    this.loadTransactions();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('');
    this.merchantIdFilter.set(null);
    this.dateFromFilter.set('');
    this.dateToFilter.set('');
    this.minAmountFilter.set(null);
    this.maxAmountFilter.set(null);
    this.isHighValueFilter.set(false);
    this.periodFilter.set('');
    this.currentPage.set(1);
    this.loadTransactions();
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

  retry(): void {
    if (this.selectedTransaction()) {
      this.loadTransactionDetail(this.selectedTransaction()!.id);
    } else {
      this.loadTransactions();
    }
  }

  exportTransactions(format = 'csv'): void {
    this.api
      .export({
        format,
        status: this.statusFilter() || undefined,
        merchantId: this.merchantIdFilter() ?? undefined,
        dateFrom: this.dateFromFilter() || undefined,
        dateTo: this.dateToFilter() || undefined,
        isHighValue: this.isHighValueFilter() || undefined,
      })
      .subscribe({
        next: async (res) => {
          const token = this.tokenStorage.getAccessToken();
          if (res.downloadUrl && token) {
            await downloadAuthenticatedExport(res.downloadUrl, token, `transactions-${Date.now()}.csv`);
          }
          this.notification.success(res.message);
        },
        error: () => this.notification.error('Export failed'),
      });
  }

  processRefund(id: number, amount: number, reason?: string, onSuccess?: () => void): void {
    this.api.refund(id, amount, reason).subscribe({
      next: () => {
        this.notification.success('Refund processed successfully');
        this.loadTransactionDetail(id);
        onSuccess?.();
      },
      error: () => this.notification.error('Refund failed'),
    });
  }

  createDispute(transactionId: number, reason: string, onSuccess?: () => void): void {
    this.api.createDispute(transactionId, reason).subscribe({
      next: () => {
        this.notification.success('Dispute created successfully');
        this.loadTransactionDetail(transactionId);
        onSuccess?.();
      },
      error: () => this.notification.error('Failed to create dispute'),
    });
  }
}
