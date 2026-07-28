import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { QrPaymentsApiService } from '../../services/qr-payments-api.service';
import { PublicQrCode } from '../../models/qr-payments.models';

@Component({
  selector: 'app-public-qr-pay',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, CurrencyPipe],
  templateUrl: './public-qr-pay.component.html',
  styleUrl: './public-qr-pay.component.scss',
})
export class PublicQrPayComponent implements OnInit {
  private readonly api = inject(QrPaymentsApiService);
  private readonly route = inject(ActivatedRoute);

  readonly pageState = signal<'loading' | 'error' | 'ready' | 'success'>('loading');
  readonly qr = signal<PublicQrCode | null>(null);
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
    this.api.getPublicQr(this.token).subscribe({
      next: (data) => {
        this.qr.set(data);
        if (data.amount != null) this.amount = String(data.amount);
        this.pageState.set('ready');
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'This QR code is not available.');
        this.pageState.set('error');
      },
    });
  }

  needsCustomAmount(): boolean {
    const q = this.qr();
    if (!q) return false;
    return q.allowCustomAmount || q.qrType === 'dynamic' || q.qrType === 'merchant' || q.amount == null;
  }

  pay(): void {
    const q = this.qr();
    if (!q) return;
    const amt = this.needsCustomAmount() ? Number(this.amount) : q.amount;
    if (!amt || amt <= 0) {
      this.error.set('Please enter a valid amount.');
      return;
    }
    this.paying.set(true);
    this.error.set('');
    this.api.pay(this.token, {
      amount: this.needsCustomAmount() ? amt : undefined,
      customerName: this.customerName.trim() || undefined,
      customerEmail: this.customerEmail.trim() || undefined,
    }).subscribe({
      next: (result) => {
        this.successMsg.set(`Payment of ${result.amount} ${result.currency} successful. Ref: ${result.transactionRef}`);
        this.pageState.set('success');
        this.paying.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Payment failed. Please try again.');
        this.paying.set(false);
      },
    });
  }
}
