import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { QrPaymentsApiService } from '../../services/qr-payments-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { QrCodeSummary } from '../../models/qr-payments.models';
import { DEFAULT_PAGE_SIZE, QR_STATUS_OPTIONS, QR_TYPE_OPTIONS } from '../../constants/qr-payments.constants';

@Component({
  selector: 'app-qr-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule, DatePipe, CurrencyPipe],
  templateUrl: './qr-list.component.html',
  styleUrl: './qr-list.component.scss',
})
export class QrListComponent implements OnInit {
  private readonly api = inject(QrPaymentsApiService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  readonly pageState = signal<'loading' | 'error' | 'empty' | 'ready'>('loading');
  readonly items = signal<QrCodeSummary[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly stats = signal({ total: 0, active: 0, disabled: 0, totalScans: 0, totalCollected: 0 });

  searchInput = '';
  statusFilter = '';
  typeFilter = '';
  merchantFilter = '';

  readonly statuses = QR_STATUS_OPTIONS;
  readonly types = QR_TYPE_OPTIONS;
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  ngOnInit(): void { this.load(); }

  load(): void {
    this.pageState.set('loading');
    this.api.list({
      page: this.page(),
      pageSize: this.pageSize(),
      search: this.searchInput || undefined,
      status: this.statusFilter || undefined,
      qrType: this.typeFilter || undefined,
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
  badgeClass(value: string): string { return `qr-badge qr-badge--${value}`; }
}
