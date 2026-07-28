import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChargebacksApiService } from '../../services/chargebacks-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { ChargebackSummary } from '../../models/chargebacks.models';
import {
  CHARGEBACK_NETWORK_OPTIONS,
  CHARGEBACK_REASON_OPTIONS,
  CHARGEBACK_STATUS_OPTIONS,
  DEFAULT_PAGE_SIZE,
} from '../../constants/chargebacks.constants';

@Component({
  selector: 'app-chargeback-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule, DatePipe, CurrencyPipe],
  templateUrl: './chargeback-list.component.html',
  styleUrl: './chargeback-list.component.scss',
})
export class ChargebackListComponent implements OnInit {
  private readonly api = inject(ChargebacksApiService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  readonly pageState = signal<'loading' | 'error' | 'empty' | 'ready'>('loading');
  readonly items = signal<ChargebackSummary[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly stats = signal({
    total: 0, open: 0, evidenceRequired: 0, underReview: 0,
    representmentSubmitted: 0, won: 0, lost: 0, openAmount: 0,
  });

  searchInput = '';
  statusFilter = '';
  reasonFilter = '';
  networkFilter = '';

  readonly statuses = CHARGEBACK_STATUS_OPTIONS;
  readonly reasons = CHARGEBACK_REASON_OPTIONS;
  readonly networks = CHARGEBACK_NETWORK_OPTIONS;
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  ngOnInit(): void { this.load(); }

  load(): void {
    this.pageState.set('loading');
    this.api.list({
      page: this.page(),
      pageSize: this.pageSize(),
      search: this.searchInput || undefined,
      status: this.statusFilter || undefined,
      reasonCode: this.reasonFilter || undefined,
      cardNetwork: this.networkFilter || undefined,
    }).subscribe({
      next: (data) => {
        this.items.set(data.items);
        this.total.set(data.pagination.total);
        this.stats.set({
          total: data.stats.total,
          open: data.stats.open,
          evidenceRequired: data.stats.evidenceRequired,
          underReview: data.stats.underReview,
          representmentSubmitted: data.stats.representmentSubmitted,
          won: data.stats.won,
          lost: data.stats.lost,
          openAmount: data.stats.openAmount,
        });
        this.pageState.set(data.items.length ? 'ready' : 'empty');
      },
      error: () => this.pageState.set('error'),
    });
  }

  onSearch(): void { this.page.set(1); this.load(); }
  onPageChange(p: number): void { this.page.set(p); this.load(); }
  badgeClass(value: string): string { return `cb-badge cb-badge--${value}`; }
}
