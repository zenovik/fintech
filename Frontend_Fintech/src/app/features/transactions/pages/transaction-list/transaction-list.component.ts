import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingStateComponent } from '../../../../shared/ui/loading-state/loading-state.component';
import { MatMenuModule } from '@angular/material/menu';
import { TransactionStateService } from '../../services/transaction-state.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import {
  PAGE_SIZE_OPTIONS,
  TRANSACTION_STATUSES,
} from '../../constants/transaction.constants';
import { TransactionStatus } from '../../constants/transaction.constants';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule, MatMenuModule, DatePipe, LoadingStateComponent],
  templateUrl: './transaction-list.component.html',
  styleUrl: './transaction-list.component.scss',
})
export class TransactionListComponent implements OnInit {
  readonly state = inject(TransactionStateService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  searchInput = '';
  statusFilter = '';
  dateFrom = '';
  dateTo = '';
  minAmount: number | null = null;
  maxAmount: number | null = null;
  showExportMenu = false;

  readonly statuses = TRANSACTION_STATUSES;
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  ngOnInit(): void {
    this.state.loadStatistics();
    this.state.loadTransactions();
  }

  onSearch(): void {
    this.state.applySearch(this.searchInput.trim());
  }

  onApplyFilters(): void {
    this.state.applyFilters({
      status: (this.statusFilter || '') as TransactionStatus | '',
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
      minAmount: this.minAmount,
      maxAmount: this.maxAmount,
    });
  }

  onClearFilters(): void {
    this.searchInput = '';
    this.statusFilter = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.minAmount = null;
    this.maxAmount = null;
    this.state.clearFilters();
  }

  onExport(format: string): void {
    this.showExportMenu = false;
    this.state.exportTransactions(format);
  }

  statusClass(code: string): string {
    if (code === 'settled') return 'settled';
    if (code === 'pending') return 'pending';
    if (code === 'failed') return 'failed';
    return 'flagged';
  }

  customerInitials(name: string | null): string {
    if (!name) return '?';
    return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
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
