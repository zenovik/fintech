import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReconciliationApiService } from '../../services/reconciliation-api.service';

@Component({
  selector: 'app-reconciliation-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, CurrencyPipe, DecimalPipe],
  templateUrl: './reconciliation-dashboard.component.html',
  styleUrl: './reconciliation-dashboard.component.scss',
})
export class ReconciliationDashboardComponent implements OnInit {
  private readonly api = inject(ReconciliationApiService);

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly dashboard = signal<Record<string, unknown> | null>(null);
  readonly imports = signal<unknown[]>([]);
  readonly unmatched = signal<unknown[]>([]);

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

    this.api.listImports({ page: 1, pageSize: 10, merchantId }).subscribe({
      next: (r) => this.imports.set((r as { items: unknown[] }).items ?? []),
    });

    this.api.listUnmatched({ page: 1, pageSize: 10, merchantId }).subscribe({
      next: (r) => this.unmatched.set((r as { items: unknown[] }).items ?? []),
    });
  }

  stats(key: string): Record<string, unknown> {
    return (this.dashboard()?.[key] as Record<string, unknown>) ?? {};
  }

  statNum(section: string, key: string): number {
    return Number(this.stats(section)[key] ?? 0);
  }
}
