import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RefundsApiService } from '../../services/refunds-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { RefundSummary } from '../../models/refunds.models';
import { DEFAULT_PAGE_SIZE, REFUND_STATUS_OPTIONS, REFUND_TYPE_OPTIONS } from '../../constants/refunds.constants';

@Component({
  selector: 'app-refund-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule, DatePipe, CurrencyPipe],
  templateUrl: './refund-list.component.html',
  styleUrl: './refund-list.component.scss',
})
export class RefundListComponent implements OnInit {
  private readonly api = inject(RefundsApiService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  readonly pageState = signal<'loading' | 'error' | 'empty' | 'ready'>('loading');
  readonly items = signal<RefundSummary[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly stats = signal({ total: 0, pending: 0, processed: 0, rejected: 0, pendingAmount: 0, processedAmount: 0 });

  searchInput = '';
  statusFilter = '';
  typeFilter = '';

  readonly statuses = REFUND_STATUS_OPTIONS;
  readonly types = REFUND_TYPE_OPTIONS;
  readonly Math = Math;
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  ngOnInit(): void { this.load(); }

  load(): void {
    this.pageState.set('loading');
    this.api.list({
      page: this.page(),
      pageSize: this.pageSize(),
      search: this.searchInput || undefined,
      status: this.statusFilter || undefined,
      refundType: this.typeFilter || undefined,
    }).subscribe({
      next: (data) => {
        this.items.set(data.items);
        this.total.set(data.pagination.total);
        this.stats.set({
          total: data.stats.total,
          pending: data.stats.pending,
          processed: data.stats.processed,
          rejected: data.stats.rejected,
          pendingAmount: data.stats.pendingAmount,
          processedAmount: data.stats.processedAmount,
        });
        this.pageState.set(data.items.length ? 'ready' : 'empty');
      },
      error: () => this.pageState.set('error'),
    });
  }

  onSearch(): void { this.page.set(1); this.load(); }
  onPageChange(p: number): void { this.page.set(p); this.load(); }
  badgeClass(value: string): string { return `ref-badge ref-badge--${value}`; }
}
