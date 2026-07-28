import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MerchantApiService } from './merchant-api.service';
import { NotificationService } from '../../../core/auth/services/notification.service';
import {
  DEFAULT_PAGE_SIZE,
  MerchantBusinessType,
  MerchantKycStatus,
  MerchantPageState,
  MerchantRiskLevel,
  MerchantStatus,
} from '../constants/merchant.constants';
import {
  CreateMerchantPayload,
  MerchantDetail,
  MerchantListItem,
  MerchantStatistics,
  MerchantTransaction,
} from '../models/merchant.models';

@Injectable({ providedIn: 'root' })
export class MerchantStateService {
  private readonly api = inject(MerchantApiService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);

  readonly pageState = signal<MerchantPageState>('idle');
  readonly errorMessage = signal<string | null>(null);

  readonly merchants = signal<MerchantListItem[]>([]);
  readonly statistics = signal<MerchantStatistics | null>(null);
  readonly selectedMerchant = signal<MerchantDetail | null>(null);
  readonly transactions = signal<MerchantTransaction[]>([]);

  readonly searchQuery = signal('');
  readonly statusFilter = signal<MerchantStatus | ''>('');
  readonly kycFilter = signal<MerchantKycStatus | ''>('');
  readonly riskFilter = signal<MerchantRiskLevel | ''>('');
  readonly businessTypeFilter = signal<MerchantBusinessType | ''>('');
  readonly dateFromFilter = signal('');
  readonly dateToFilter = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly totalItems = signal(0);
  readonly totalPages = signal(0);

  readonly isEmpty = computed(
    () => this.pageState() === 'loaded' && this.merchants().length === 0,
  );
  readonly hasFilters = computed(
    () =>
      !!this.searchQuery() ||
      !!this.statusFilter() ||
      !!this.kycFilter() ||
      !!this.riskFilter() ||
      !!this.businessTypeFilter() ||
      !!this.dateFromFilter() ||
      !!this.dateToFilter(),
  );

  loadMerchants(): void {
    this.pageState.set('loading');
    this.errorMessage.set(null);

    this.api
      .list({
        page: this.currentPage(),
        pageSize: this.pageSize(),
        search: this.searchQuery() || undefined,
        status: this.statusFilter() || undefined,
        kycStatus: this.kycFilter() || undefined,
        riskLevel: this.riskFilter() || undefined,
        businessType: this.businessTypeFilter() || undefined,
        dateFrom: this.dateFromFilter() || undefined,
        dateTo: this.dateToFilter() || undefined,
      })
      .subscribe({
        next: (data) => {
          this.merchants.set(data.items);
          this.totalItems.set(data.pagination.total);
          this.totalPages.set(data.pagination.totalPages);
          this.pageState.set(data.items.length === 0 ? 'empty' : 'loaded');
        },
        error: () => {
          this.pageState.set('error');
          this.errorMessage.set('Unable to load merchants. Please try again.');
        },
      });
  }

  loadStatistics(): void {
    this.api.getStatistics().subscribe({
      next: (stats) => this.statistics.set(stats),
      error: () => {},
    });
  }

  loadMerchantDetail(id: number): void {
    this.pageState.set('loading');
    this.errorMessage.set(null);

    this.api.getById(id).subscribe({
      next: (merchant) => {
        this.selectedMerchant.set(merchant);
        this.pageState.set('loaded');
      },
      error: () => {
        this.pageState.set('error');
        this.errorMessage.set('Merchant not found or unavailable.');
      },
    });
  }

  loadMerchantTransactions(id: number): void {
    this.api.getTransactions(id, 1, 5).subscribe({
      next: (data) => this.transactions.set(data.items),
      error: () => this.transactions.set([]),
    });
  }

  applySearch(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
    this.loadMerchants();
  }

  applyFilters(filters: {
    status?: MerchantStatus | '';
    kycStatus?: MerchantKycStatus | '';
    riskLevel?: MerchantRiskLevel | '';
    businessType?: MerchantBusinessType | '';
    dateFrom?: string;
    dateTo?: string;
  }): void {
    if (filters.status !== undefined) this.statusFilter.set(filters.status);
    if (filters.kycStatus !== undefined) this.kycFilter.set(filters.kycStatus);
    if (filters.riskLevel !== undefined) this.riskFilter.set(filters.riskLevel);
    if (filters.businessType !== undefined) this.businessTypeFilter.set(filters.businessType);
    if (filters.dateFrom !== undefined) this.dateFromFilter.set(filters.dateFrom);
    if (filters.dateTo !== undefined) this.dateToFilter.set(filters.dateTo);
    this.currentPage.set(1);
    this.loadMerchants();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('');
    this.kycFilter.set('');
    this.riskFilter.set('');
    this.businessTypeFilter.set('');
    this.dateFromFilter.set('');
    this.dateToFilter.set('');
    this.currentPage.set(1);
    this.loadMerchants();
  }

  setPage(page: number): void {
    this.currentPage.set(page);
    this.loadMerchants();
  }

  setPageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadMerchants();
  }

  retry(): void {
    if (this.selectedMerchant()) {
      const id = this.selectedMerchant()!.id;
      this.loadMerchantDetail(id);
    } else {
      this.loadMerchants();
    }
  }

  createMerchant(payload: CreateMerchantPayload, onSuccess?: () => void): void {
    this.pageState.set('loading');
    this.api.create(payload).subscribe({
      next: (merchant) => {
        this.notification.success('Merchant created successfully');
        this.pageState.set('loaded');
        if (onSuccess) onSuccess();
        else this.router.navigate(['/merchants', merchant.id]);
      },
      error: () => {
        this.pageState.set('error');
        this.errorMessage.set('Failed to create merchant. Please check the form and try again.');
      },
    });
  }

  updateMerchant(id: number, payload: Partial<CreateMerchantPayload>, onSuccess?: () => void): void {
    this.pageState.set('loading');
    this.api.update(id, payload).subscribe({
      next: (merchant) => {
        this.selectedMerchant.set(merchant);
        this.notification.success('Merchant updated successfully');
        this.pageState.set('loaded');
        if (onSuccess) onSuccess();
        else this.router.navigate(['/merchants', id]);
      },
      error: () => {
        this.pageState.set('error');
        this.errorMessage.set('Failed to update merchant.');
      },
    });
  }

  updateStatus(id: number, status: MerchantStatus, reason?: string): void {
    this.api.updateStatus(id, status, reason).subscribe({
      next: (merchant) => {
        this.selectedMerchant.set(merchant);
        this.notification.success(`Merchant status updated to ${status}`);
      },
      error: () => this.notification.error('Failed to update merchant status'),
    });
  }

  deleteMerchant(id: number): void {
    this.api.delete(id).subscribe({
      next: () => {
        this.notification.success('Merchant deleted');
        this.router.navigate(['/merchants']);
      },
      error: () => this.notification.error('Failed to delete merchant'),
    });
  }
}
