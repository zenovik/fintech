import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MerchantStateService } from '../../services/merchant-state.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import {
  MERCHANT_BUSINESS_TYPES,
  MERCHANT_KYC_STATUSES,
  MERCHANT_RISK_LEVELS,
  MERCHANT_STATUSES,
  PAGE_SIZE_OPTIONS,
} from '../../constants/merchant.constants';
import {
  MerchantBusinessType,
  MerchantKycStatus,
  MerchantRiskLevel,
  MerchantStatus,
} from '../../constants/merchant.constants';

@Component({
  selector: 'app-merchant-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatButtonModule,
    DatePipe,
  ],
  templateUrl: './merchant-list.component.html',
  styleUrl: './merchant-list.component.scss',
})
export class MerchantListComponent implements OnInit {
  readonly state = inject(MerchantStateService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  searchInput = '';
  statusFilter = '';
  kycFilter = '';
  riskFilter = '';
  dateFrom = '';
  dateTo = '';

  readonly statuses = MERCHANT_STATUSES;
  readonly kycStatuses = MERCHANT_KYC_STATUSES;
  readonly riskLevels = MERCHANT_RISK_LEVELS;
  readonly businessTypes = MERCHANT_BUSINESS_TYPES;
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  selectedIds = new Set<number>();

  ngOnInit(): void {
    this.state.loadStatistics();
    this.state.loadMerchants();
  }

  onSearch(): void {
    this.state.applySearch(this.searchInput.trim());
  }

  onApplyFilters(): void {
    this.state.applyFilters({
      status: (this.statusFilter || '') as MerchantStatus | '',
      kycStatus: (this.kycFilter || '') as MerchantKycStatus | '',
      riskLevel: (this.riskFilter || '') as MerchantRiskLevel | '',
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
    });
  }

  onClearFilters(): void {
    this.searchInput = '';
    this.statusFilter = '';
    this.kycFilter = '';
    this.riskFilter = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.state.clearFilters();
  }

  toggleSelect(id: number): void {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
    else this.selectedIds.add(id);
  }

  toggleSelectAll(): void {
    const items = this.state.merchants();
    if (this.selectedIds.size === items.length) {
      this.selectedIds.clear();
    } else {
      items.forEach((m) => this.selectedIds.add(m.id));
    }
  }

  get allSelected(): boolean {
    const items = this.state.merchants();
    return items.length > 0 && this.selectedIds.size === items.length;
  }

  formatBusinessType(type: MerchantBusinessType | null): string {
    if (!type) return '—';
    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  kycIcon(status: MerchantKycStatus): string {
    if (status === 'verified') return 'check_circle';
    if (status === 'rejected') return 'cancel';
    return 'pending';
  }

  riskColor(level: MerchantRiskLevel): string {
    if (level === 'high') return 'high';
    if (level === 'medium') return 'medium';
    return 'low';
  }

  pageRangeStart(): number {
    return (this.state.currentPage() - 1) * this.state.pageSize() + 1;
  }

  pageRangeEnd(): number {
    return Math.min(this.state.currentPage() * this.state.pageSize(), this.state.totalItems());
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.state.totalPages()) {
      this.state.setPage(page);
    }
  }
}
