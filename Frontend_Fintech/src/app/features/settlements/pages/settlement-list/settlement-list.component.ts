import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SettlementStateService } from '../../services/settlement-state.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { PAGE_SIZE_OPTIONS, SETTLEMENT_STATUSES } from '../../constants/settlement.constants';
import { SettlementStatus } from '../../constants/settlement.constants';

@Component({
  selector: 'app-settlement-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule, DatePipe, CurrencyPipe, TitleCasePipe],
  templateUrl: './settlement-list.component.html',
  styleUrl: './settlement-list.component.scss',
})
export class SettlementListComponent implements OnInit {
  readonly state = inject(SettlementStateService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  searchInput = '';
  statusFilter = '';
  dateFrom = '';
  dateTo = '';
  showExportMenu = false;

  readonly statuses = SETTLEMENT_STATUSES;
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  ngOnInit(): void {
    this.state.loadStatistics();
    this.state.loadSettlements();
  }

  onSearch(): void { this.state.applySearch(this.searchInput.trim()); }

  onApplyFilters(): void {
    this.state.applyFilters({
      status: (this.statusFilter || '') as SettlementStatus | '',
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
    });
  }

  onClearFilters(): void {
    this.searchInput = '';
    this.statusFilter = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.state.clearFilters();
  }

  onExport(format: string): void {
    this.showExportMenu = false;
    this.state.exportSettlements(format);
  }

  statusClass(code: string): string {
    if (code === 'processed') return 'processed';
    if (code === 'pending') return 'pending';
    if (code === 'processing') return 'processing';
    if (code === 'failed') return 'failed';
    return 'reversed';
  }

  pageRangeStart(): number {
    return (this.state.currentPage() - 1) * this.state.pageSize() + 1;
  }

  pageRangeEnd(): number {
    return Math.min(this.state.currentPage() * this.state.pageSize(), this.state.totalItems());
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.state.totalPages()) this.state.setPage(page);
  }
}
