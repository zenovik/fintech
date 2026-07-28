import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WebhooksApiService } from '../../services/webhooks-api.service';

@Component({
  selector: 'app-webhooks-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, DecimalPipe],
  templateUrl: './webhooks-dashboard.component.html',
  styleUrl: './webhooks-dashboard.component.scss',
})
export class WebhooksDashboardComponent implements OnInit {
  private readonly api = inject(WebhooksApiService);

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly dashboard = signal<Record<string, unknown> | null>(null);
  readonly endpoints = signal<unknown[]>([]);
  readonly deliveries = signal<unknown[]>([]);

  merchantFilter = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.pageState.set('loading');
    const merchantId = this.merchantFilter ? Number(this.merchantFilter) : undefined;

    this.api.dashboard(merchantId).subscribe({
      next: (d) => {
        this.dashboard.set(d as Record<string, unknown>);
        this.pageState.set('ready');
      },
      error: () => this.pageState.set('error'),
    });

    this.api.listEndpoints({ page: 1, pageSize: 10, merchantId }).subscribe({
      next: (r) => this.endpoints.set((r as { items: unknown[] }).items ?? []),
    });

    this.api.listDeliveries({ page: 1, pageSize: 10, merchantId }).subscribe({
      next: (r) => this.deliveries.set((r as { items: unknown[] }).items ?? []),
    });
  }

  stats(key: string): Record<string, unknown> {
    return (this.dashboard()?.[key] as Record<string, unknown>) ?? {};
  }

  statNum(section: string, key: string): number {
    return Number(this.stats(section)[key] ?? 0);
  }

  healthClass(status: string): string {
    if (status === 'healthy') return 'wh-health--ok';
    if (status === 'degraded') return 'wh-health--warn';
    return 'wh-health--bad';
  }
}
