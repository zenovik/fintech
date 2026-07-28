import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuditApiService } from '../../services/audit-api.service';
import { ApiLogItem } from '../../models/audit.models';
import { DATE_RANGE_OPTIONS, HTTP_METHOD_OPTIONS, DEFAULT_PAGE_SIZE } from '../../constants/audit.constants';

@Component({
  selector: 'app-api-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, DatePipe],
  templateUrl: './api-logs.component.html',
  styleUrl: './api-logs.component.scss',
})
export class ApiLogsComponent implements OnInit {
  private readonly api = inject(AuditApiService);

  readonly pageState = signal<'loading' | 'error' | 'empty' | 'ready'>('loading');
  readonly errorMessage = signal('');
  readonly logs = signal<ApiLogItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly selected = signal<ApiLogItem | null>(null);

  searchInput = '';
  methodFilter = '';
  dateRange = '24h';

  readonly dateRanges = DATE_RANGE_OPTIONS;
  readonly methods = HTTP_METHOD_OPTIONS;
  readonly Math = Math;
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.pageState.set('loading');
    this.api
      .listApiLogs({
        page: this.page(),
        pageSize: this.pageSize(),
        search: this.searchInput || undefined,
        method: this.methodFilter || undefined,
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
          this.errorMessage.set(err?.error?.message ?? 'Failed to load API logs');
          this.pageState.set('error');
        },
      });
  }

  onSearch(): void {
    this.page.set(1);
    this.load();
  }

  selectLog(log: ApiLogItem): void {
    this.selected.set(log);
  }

  getMethodClass(method: string): string {
    return `api-method--${method.toLowerCase()}`;
  }

  getStatusClass(code: number): string {
    if (code >= 500) return 'api-status--error';
    if (code >= 400) return 'api-status--warn';
    return 'api-status--ok';
  }

  goToPage(p: number): void {
    this.page.set(p);
    this.load();
  }
}
