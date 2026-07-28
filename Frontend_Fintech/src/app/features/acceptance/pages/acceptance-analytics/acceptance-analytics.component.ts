import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AcceptanceApiService } from '../../services/acceptance-api.service';

@Component({
  selector: 'app-acceptance-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, CurrencyPipe, DecimalPipe],
  templateUrl: './acceptance-analytics.component.html',
  styleUrl: './acceptance-analytics.component.scss',
})
export class AcceptanceAnalyticsComponent implements OnInit {
  private readonly api = inject(AcceptanceApiService);

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly analytics = signal<Record<string, unknown> | null>(null);
  readonly topMerchants = signal<unknown[]>([]);
  readonly failures = signal<unknown[]>([]);

  days = 30;
  merchantFilter = '';

  ngOnInit(): void { this.load(); }

  load(): void {
    this.pageState.set('loading');
    const merchantId = this.merchantFilter ? Number(this.merchantFilter) : undefined;
    this.api.analytics(merchantId, this.days).subscribe({
      next: (d) => { this.analytics.set(d as Record<string, unknown>); this.pageState.set('ready'); },
      error: () => this.pageState.set('error'),
    });
    this.api.topMerchants(10).subscribe({ next: (d) => this.topMerchants.set(d as unknown[]) });
    this.api.failureInsights(merchantId).subscribe({ next: (d) => this.failures.set(d as unknown[]) });
  }

  totals(key: string): number {
    return Number((this.analytics()?.['totals'] as Record<string, unknown>)?.[key] ?? 0);
  }

  conversionRate(): number {
    return Number(this.analytics()?.['conversionRate'] ?? 0);
  }
}
