import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PayoutsApiService } from '../../services/payouts-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { PayoutSummary } from '../../models/payouts.models';
import { DEFAULT_PAGE_SIZE, PAYOUT_METHOD_OPTIONS, PAYOUT_STATUS_OPTIONS, PAYOUT_TYPE_OPTIONS } from '../../constants/payouts.constants';

@Component({
  selector: 'app-payout-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule, DatePipe, CurrencyPipe],
  templateUrl: './payout-list.component.html',
  styleUrl: './payout-list.component.scss',
})
export class PayoutListComponent implements OnInit {
  private readonly api = inject(PayoutsApiService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  readonly pageState = signal<'loading' | 'error' | 'empty' | 'ready'>('loading');
  readonly items = signal<PayoutSummary[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly stats = signal({ pending: 0, scheduled: 0, confirmed: 0, failed: 0, pendingAmount: 0, confirmedAmount: 0 });

  searchInput = '';
  statusFilter = '';
  typeFilter = '';
  methodFilter = '';

  readonly statuses = PAYOUT_STATUS_OPTIONS;
  readonly types = PAYOUT_TYPE_OPTIONS;
  readonly methods = PAYOUT_METHOD_OPTIONS;
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  ngOnInit(): void { this.load(); }

  load(): void {
    this.pageState.set('loading');
    this.api.list({
      page: this.page(), pageSize: this.pageSize(),
      search: this.searchInput || undefined,
      status: this.statusFilter || undefined,
      payoutType: this.typeFilter || undefined,
      payoutMethod: this.methodFilter || undefined,
    }).subscribe({
      next: (data) => {
        this.items.set(data.items);
        this.total.set(data.pagination.total);
        this.stats.set({
          pending: data.stats.pending,
          scheduled: data.stats.scheduled,
          confirmed: data.stats.confirmed,
          failed: data.stats.failed,
          pendingAmount: data.stats.pendingAmount,
          confirmedAmount: data.stats.confirmedAmount,
        });
        this.pageState.set(data.items.length ? 'ready' : 'empty');
      },
      error: () => this.pageState.set('error'),
    });
  }

  onSearch(): void { this.page.set(1); this.load(); }
  onPageChange(p: number): void { this.page.set(p); this.load(); }
  badgeClass(value: string): string { return `po-badge po-badge--${value}`; }
}
