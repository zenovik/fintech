import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuditApiService } from '../../services/audit-api.service';
import { AuditLogItem } from '../../models/audit.models';
import { DEFAULT_PAGE_SIZE } from '../../constants/audit.constants';

@Component({
  selector: 'app-audit-timeline',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, DatePipe],
  templateUrl: './audit-timeline.component.html',
  styleUrl: './audit-timeline.component.scss',
})
export class AuditTimelineComponent implements OnInit {
  private readonly api = inject(AuditApiService);
  private readonly router = inject(Router);

  readonly pageState = signal<'loading' | 'error' | 'empty' | 'ready'>('loading');
  readonly errorMessage = signal('');
  readonly logs = signal<AuditLogItem[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.pageState.set('loading');
    this.api.list({ page: 1, pageSize: 50, dateRange: '7d', sortBy: 'created_at', sortOrder: 'desc' }).subscribe({
      next: (res) => {
        this.logs.set(res.items);
        this.pageState.set(res.items.length === 0 ? 'empty' : 'ready');
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Failed to load timeline');
        this.pageState.set('error');
      },
    });
  }

  openLog(id: number): void {
    this.router.navigate(['/audit', id]);
  }

  getIcon(module: string): string {
    const icons: Record<string, string> = {
      authentication: 'login',
      users: 'person',
      settings: 'settings',
      notifications: 'notifications',
      merchants: 'store',
      transactions: 'payments',
      settlements: 'account_balance',
      reports: 'assessment',
      security: 'security',
      system: 'dns',
    };
    return icons[module] ?? 'history';
  }
}
