import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuditApiService } from '../../services/audit-api.service';
import { WebhookLogItem } from '../../models/audit.models';
import { DATE_RANGE_OPTIONS, WEBHOOK_STATUS_OPTIONS, DEFAULT_PAGE_SIZE } from '../../constants/audit.constants';

@Component({
  selector: 'app-webhook-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, DatePipe],
  templateUrl: './webhook-logs.component.html',
  styleUrl: './webhook-logs.component.scss',
})
export class WebhookLogsComponent implements OnInit {
  private readonly api = inject(AuditApiService);

  readonly pageState = signal<'loading' | 'error' | 'empty' | 'ready'>('loading');
  readonly errorMessage = signal('');
  readonly logs = signal<WebhookLogItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly selected = signal<WebhookLogItem | null>(null);

  searchInput = '';
  statusFilter = '';
  dateRange = '24h';

  readonly dateRanges = DATE_RANGE_OPTIONS;
  readonly statuses = WEBHOOK_STATUS_OPTIONS;
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.pageState.set('loading');
    this.api
      .listWebhookLogs({
        page: this.page(),
        pageSize: this.pageSize(),
        search: this.searchInput || undefined,
        status: this.statusFilter || undefined,
        dateRange: this.dateRange || undefined,
      })
      .subscribe({
        next: (res) => {
          this.logs.set(res.items);
          this.total.set(res.total);
          if (res.items.length && !this.selected()) this.selected.set(res.items[0]);
          this.pageState.set(res.items.length === 0 ? 'empty' : 'ready');
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message ?? 'Failed to load webhook logs');
          this.pageState.set('error');
        },
      });
  }

  onSearch(): void {
    this.page.set(1);
    this.load();
  }

  selectLog(log: WebhookLogItem): void {
    this.selected.set(log);
  }

  getStatusClass(status: string): string {
    return `webhook-status--${status}`;
  }

  goToPage(p: number): void {
    this.page.set(p);
    this.load();
  }
}
