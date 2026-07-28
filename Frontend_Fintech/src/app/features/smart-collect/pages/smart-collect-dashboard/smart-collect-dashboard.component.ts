import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SmartCollectApiService } from '../../services/smart-collect-api.service';

@Component({
  selector: 'app-smart-collect-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, CurrencyPipe, DecimalPipe],
  templateUrl: './smart-collect-dashboard.component.html',
  styleUrl: './smart-collect-dashboard.component.scss',
})
export class SmartCollectDashboardComponent implements OnInit {
  private readonly api = inject(SmartCollectApiService);

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly dashboard = signal<Record<string, unknown> | null>(null);
  readonly collections = signal<unknown[]>([]);

  merchantFilter = '';

  ngOnInit(): void { this.load(); }

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
    this.api.listCollections({ page: 1, pageSize: 10, merchantId }).subscribe({
      next: (r) => this.collections.set((r as { items: unknown[] }).items ?? []),
    });
  }

  stats(key: string): Record<string, unknown> {
    return (this.dashboard()?.[key] as Record<string, unknown>) ?? {};
  }

  statNum(section: string, key: string): number {
    return Number(this.stats(section)[key] ?? 0);
  }
}
