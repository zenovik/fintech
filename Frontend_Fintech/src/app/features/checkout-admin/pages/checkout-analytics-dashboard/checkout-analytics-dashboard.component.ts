import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CheckoutApiService } from '../../../checkout/services/checkout-api.service';
import { CheckoutAnalytics } from '../../../checkout/models/checkout.models';

@Component({
  selector: 'app-checkout-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, DecimalPipe],
  templateUrl: './checkout-analytics-dashboard.component.html',
  styleUrl: './checkout-analytics-dashboard.component.scss',
})
export class CheckoutAnalyticsDashboardComponent implements OnInit {
  private readonly api = inject(CheckoutApiService);

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly analytics = signal<CheckoutAnalytics | null>(null);

  days = 30;
  merchantId = '';

  ngOnInit(): void { this.load(); }

  load(): void {
    this.pageState.set('loading');
    this.api.getAnalytics(
      this.merchantId ? Number(this.merchantId) : undefined,
      this.days,
    ).subscribe({
      next: (d) => { this.analytics.set(d); this.pageState.set('ready'); },
      error: () => this.pageState.set('error'),
    });
  }

  totalByStatus(status: string): number {
    const row = this.analytics()?.summary.find((s) => s.status === status);
    return row?.cnt ?? 0;
  }

  totalEvents(type: string): number {
    const row = this.analytics()?.events.find((e) => e.event_type === type);
    return row?.cnt ?? 0;
  }

  conversionRate(): number {
    const viewed = this.totalEvents('viewed') || 1;
    const completed = this.totalEvents('completed');
    return Math.round((completed / viewed) * 1000) / 10;
  }
}
