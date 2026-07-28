import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AcceptanceApiService } from '../../../acceptance/services/acceptance-api.service';

@Component({
  selector: 'app-merchant-payment-portal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule, CurrencyPipe],
  templateUrl: './merchant-payment-portal.component.html',
  styleUrl: './merchant-payment-portal.component.scss',
})
export class MerchantPaymentPortalComponent implements OnInit {
  private readonly api = inject(AcceptanceApiService);

  readonly pageState = signal<'idle' | 'loading' | 'error' | 'ready'>('idle');
  readonly portal = signal<Record<string, unknown> | null>(null);

  merchantId = '1';

  ngOnInit(): void { if (this.merchantId) this.load(); }

  load(): void {
    if (!this.merchantId) return;
    this.pageState.set('loading');
    this.api.merchantPortal(Number(this.merchantId)).subscribe({
      next: (d) => { this.portal.set(d as Record<string, unknown>); this.pageState.set('ready'); },
      error: () => this.pageState.set('error'),
    });
  }

  stat(section: string, key: string): number {
    const s = (this.portal()?.['stats'] as Record<string, Record<string, unknown>>)?.[section];
    return Number(s?.[key] ?? 0);
  }
}
