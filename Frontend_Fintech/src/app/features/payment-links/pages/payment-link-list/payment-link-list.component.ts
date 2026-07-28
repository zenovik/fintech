import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, PercentPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PaymentLinksApiService } from '../../services/payment-links-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { PaymentLinkSummary } from '../../models/payment-links.models';
import { DEFAULT_PAGE_SIZE, PAYMENT_LINK_STATUS_OPTIONS } from '../../constants/payment-links.constants';

@Component({
  selector: 'app-payment-link-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule, DatePipe, CurrencyPipe, PercentPipe],
  templateUrl: './payment-link-list.component.html',
  styleUrl: './payment-link-list.component.scss',
})
export class PaymentLinkListComponent implements OnInit {
  private readonly api = inject(PaymentLinksApiService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  readonly pageState = signal<'loading' | 'error' | 'empty' | 'ready'>('loading');
  readonly items = signal<PaymentLinkSummary[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly stats = signal({
    total: 0, active: 0, disabled: 0, expired: 0,
    totalCollected: 0, totalUsage: 0, conversionRate: 0,
  });

  searchInput = '';
  statusFilter = '';
  merchantFilter = '';

  readonly statuses = PAYMENT_LINK_STATUS_OPTIONS;
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  ngOnInit(): void { this.load(); }

  load(): void {
    this.pageState.set('loading');
    this.api.list({
      page: this.page(),
      pageSize: this.pageSize(),
      search: this.searchInput || undefined,
      status: this.statusFilter || undefined,
      merchantId: this.merchantFilter ? Number(this.merchantFilter) : undefined,
    }).subscribe({
      next: (data) => {
        this.items.set(data.items);
        this.total.set(data.pagination.total);
        this.stats.set(data.stats);
        this.pageState.set(data.items.length ? 'ready' : 'empty');
      },
      error: () => this.pageState.set('error'),
    });
  }

  onSearch(): void { this.page.set(1); this.load(); }
  onPageChange(p: number): void { this.page.set(p); this.load(); }
  badgeClass(value: string): string { return `pl-badge pl-badge--${value}`; }
}
