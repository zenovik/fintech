import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CheckoutApiService } from '../../../checkout/services/checkout-api.service';
import { CheckoutSessionDetail } from '../../../checkout/models/checkout.models';

@Component({
  selector: 'app-checkout-session-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatProgressSpinnerModule, DatePipe, CurrencyPipe],
  templateUrl: './checkout-session-detail.component.html',
  styleUrl: './checkout-session-detail.component.scss',
})
export class CheckoutSessionDetailComponent implements OnInit {
  private readonly api = inject(CheckoutApiService);
  private readonly route = inject(ActivatedRoute);

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly detail = signal<CheckoutSessionDetail | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getSession(id).subscribe({
      next: (d) => { this.detail.set(d); this.pageState.set('ready'); },
      error: () => this.pageState.set('error'),
    });
  }
}
