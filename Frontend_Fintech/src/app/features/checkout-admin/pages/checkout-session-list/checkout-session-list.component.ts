import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CheckoutApiService } from '../../../checkout/services/checkout-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { CheckoutSessionSummary } from '../../../checkout/models/checkout.models';
import { CHECKOUT_STATUS_OPTIONS, DEFAULT_PAGE_SIZE } from '../../../checkout/constants/checkout.constants';

@Component({
  selector: 'app-checkout-session-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule, DatePipe, CurrencyPipe],
  templateUrl: './checkout-session-list.component.html',
  styleUrl: './checkout-session-list.component.scss',
})
export class CheckoutSessionListComponent implements OnInit {
  private readonly api = inject(CheckoutApiService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  readonly pageState = signal<'loading' | 'error' | 'empty' | 'ready'>('loading');
  readonly items = signal<CheckoutSessionSummary[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);

  statusFilter = '';
  merchantFilter = '';
  readonly statuses = CHECKOUT_STATUS_OPTIONS;
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  ngOnInit(): void { this.load(); }

  load(): void {
    this.pageState.set('loading');
    this.api.listSessions({
      page: this.page(),
      pageSize: this.pageSize(),
      status: this.statusFilter || undefined,
      merchantId: this.merchantFilter ? Number(this.merchantFilter) : undefined,
    }).subscribe({
      next: (data) => {
        this.items.set(data.items);
        this.total.set(data.pagination.total);
        this.pageState.set(data.items.length ? 'ready' : 'empty');
      },
      error: () => this.pageState.set('error'),
    });
  }

  onSearch(): void { this.page.set(1); this.load(); }
  onPageChange(p: number): void { this.page.set(p); this.load(); }
  badgeClass(s: string): string { return `co-badge co-badge--${s}`; }
}
