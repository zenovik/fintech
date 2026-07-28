import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, PercentPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InvoicesApiService } from '../../services/invoices-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { InvoiceSummary } from '../../models/invoices.models';
import { DEFAULT_PAGE_SIZE, INVOICE_STATUS_OPTIONS } from '../../constants/invoices.constants';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule, DatePipe, CurrencyPipe, PercentPipe],
  templateUrl: './invoice-list.component.html',
  styleUrl: './invoice-list.component.scss',
})
export class InvoiceListComponent implements OnInit {
  private readonly api = inject(InvoicesApiService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  readonly pageState = signal<'loading' | 'error' | 'empty' | 'ready'>('loading');
  readonly items = signal<InvoiceSummary[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly stats = signal({ total: 0, draft: 0, sent: 0, paid: 0, overdue: 0, outstandingAmount: 0, paidAmount: 0, collectionRate: 0 });

  searchInput = '';
  statusFilter = '';
  readonly statuses = INVOICE_STATUS_OPTIONS;
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  ngOnInit(): void { this.load(); }

  load(): void {
    this.pageState.set('loading');
    this.api.list({ page: this.page(), pageSize: this.pageSize(), search: this.searchInput || undefined, status: this.statusFilter || undefined }).subscribe({
      next: (data) => {
        this.items.set(data.items);
        this.total.set(data.pagination.total);
        this.stats.set({
          total: data.stats.total, draft: data.stats.draft, sent: data.stats.sent,
          paid: data.stats.paid, overdue: data.stats.overdue,
          outstandingAmount: data.stats.outstandingAmount, paidAmount: data.stats.paidAmount,
          collectionRate: data.stats.collectionRate,
        });
        this.pageState.set(data.items.length ? 'ready' : 'empty');
      },
      error: () => this.pageState.set('error'),
    });
  }

  onSearch(): void { this.page.set(1); this.load(); }
  onPageChange(p: number): void { this.page.set(p); this.load(); }
  badgeClass(v: string): string { return `inv-badge inv-badge--${v}`; }
}
