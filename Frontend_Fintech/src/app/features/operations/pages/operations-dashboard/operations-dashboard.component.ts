import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OperationsApiService } from '../../services/operations-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';

@Component({
  selector: 'app-operations-dashboard',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, DatePipe, CurrencyPipe],
  templateUrl: './operations-dashboard.component.html',
  styleUrl: './operations-dashboard.component.scss',
})
export class OperationsDashboardComponent implements OnInit {
  private readonly api = inject(OperationsApiService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;
  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly dashboard = signal<Record<string, number>>({});
  readonly health = signal<{ database: string; api: string }>({ database: '', api: '' });
  readonly alerts = signal<Record<string, unknown>[]>([]);
  readonly incidents = signal<Record<string, unknown>[]>([]);
  readonly retryQueue = signal<Record<string, unknown>[]>([]);
  readonly jobs = signal<Record<string, unknown>[]>([]);
  readonly pendingTasks = signal<Record<string, number>>({});
  readonly failedPayments = signal<Record<string, unknown>[]>([]);
  readonly failedPayouts = signal<Record<string, unknown>[]>([]);
  readonly failedWebhooks = signal<Record<string, unknown>[]>([]);
  readonly saving = signal(false);

  ngOnInit(): void { this.load(); }
  load(): void {
    this.pageState.set('loading');
    this.api.loadAll().subscribe({
      next: (d) => {
        this.dashboard.set(d.dashboard); this.health.set(d.health);
        this.alerts.set(d.alerts.items as Record<string, unknown>[]);
        this.incidents.set(d.incidents.items as Record<string, unknown>[]);
        this.retryQueue.set(d.retryQueue.items as Record<string, unknown>[]);
        this.jobs.set(d.jobs.items as Record<string, unknown>[]);
        this.pendingTasks.set(d.pendingTasks ?? {});
        this.failedPayments.set(d.failedPayments as Record<string, unknown>[]);
        this.failedPayouts.set(d.failedPayouts as Record<string, unknown>[]);
        this.failedWebhooks.set(d.failedWebhooks as Record<string, unknown>[]);
        this.pageState.set('ready');
      },
      error: () => this.pageState.set('error'),
    });
  }

  retryQueueItem(id: number): void {
    if (!this.rbac.hasPermission(this.perms.OPERATIONS_MANAGE)) return;
    this.saving.set(true);
    this.api.retryQueueItem(id).subscribe({ next: () => { this.saving.set(false); this.load(); }, error: () => this.saving.set(false) });
  }

  retryJob(id: number): void {
    if (!this.rbac.hasPermission(this.perms.OPERATIONS_MANAGE)) return;
    this.saving.set(true);
    this.api.retryJob(id).subscribe({ next: () => { this.saving.set(false); this.load(); }, error: () => this.saving.set(false) });
  }
}
