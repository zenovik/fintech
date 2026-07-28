import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PaymentLinksApiService } from '../../services/payment-links-api.service';
import { PublicPaymentLink } from '../../models/payment-links.models';

@Component({
  selector: 'app-public-pay',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, CurrencyPipe],
  templateUrl: './public-pay.component.html',
  styleUrl: './public-pay.component.scss',
})
export class PublicPayComponent implements OnInit {
  private readonly api = inject(PaymentLinksApiService);
  private readonly route = inject(ActivatedRoute);

  readonly pageState = signal<'loading' | 'error' | 'ready' | 'success'>('loading');
  readonly link = signal<PublicPaymentLink | null>(null);
  readonly paying = signal(false);
  readonly error = signal('');
  readonly successMsg = signal('');

  token = '';
  amount = '';
  customerName = '';
  customerEmail = '';

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    if (!this.token) {
      this.pageState.set('error');
      return;
    }
    this.api.getPublicLink(this.token).subscribe({
      next: (data) => {
        this.link.set(data);
        if (data.amount != null) this.amount = String(data.amount);
        this.pageState.set('ready');
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'This payment link is not available.');
        this.pageState.set('error');
      },
    });
  }

  pay(): void {
    const l = this.link();
    if (!l) return;
    const amt = l.allowCustomAmount ? Number(this.amount) : l.amount;
    if (!amt || amt <= 0) {
      this.error.set('Please enter a valid amount.');
      return;
    }
    this.paying.set(true);
    this.error.set('');
    this.api.pay(this.token, {
      amount: l.allowCustomAmount ? amt : undefined,
      customerName: this.customerName.trim() || undefined,
      customerEmail: this.customerEmail.trim() || undefined,
    }).subscribe({
      next: (result) => {
        this.successMsg.set(`Payment of ${result.amount} ${result.currency} successful. Ref: ${result.transactionRef}`);
        this.pageState.set('success');
        this.paying.set(false);
        if (result.successUrl) {
          setTimeout(() => { window.location.href = result.successUrl!; }, 2000);
        } else if (result.redirectUrl) {
          setTimeout(() => { window.location.href = result.redirectUrl!; }, 2000);
        }
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Payment failed. Please try again.');
        this.paying.set(false);
      },
    });
  }
}
