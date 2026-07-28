import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { QrPaymentsApiService } from '../../services/qr-payments-api.service';
import { CURRENCY_OPTIONS, QR_TYPE_CREATE_OPTIONS } from '../../constants/qr-payments.constants';

@Component({
  selector: 'app-qr-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule],
  templateUrl: './qr-create.component.html',
  styleUrl: './qr-create.component.scss',
})
export class QrCreateComponent {
  private readonly api = inject(QrPaymentsApiService);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly error = signal('');

  merchantId = '';
  customerId = '';
  qrType = 'static';
  title = '';
  description = '';
  amount = '';
  currency = 'USD';
  allowCustomAmount = false;
  expiresAt = '';

  readonly currencies = CURRENCY_OPTIONS;
  readonly qrTypes = QR_TYPE_CREATE_OPTIONS;

  submit(): void {
    const mId = Number(this.merchantId);
    if (!mId || !this.title.trim()) {
      this.error.set('Merchant ID and title are required.');
      return;
    }
    const needsAmount = !this.allowCustomAmount && this.qrType !== 'dynamic' && this.qrType !== 'merchant';
    if (needsAmount && (!this.amount || Number(this.amount) <= 0)) {
      this.error.set('Amount is required unless custom amounts are allowed or type is dynamic/merchant.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.api.create({
      merchantId: mId,
      customerId: this.customerId ? Number(this.customerId) : undefined,
      qrType: this.qrType,
      title: this.title.trim(),
      description: this.description.trim() || undefined,
      amount: this.allowCustomAmount ? undefined : Number(this.amount) || undefined,
      currency: this.currency,
      allowCustomAmount: this.allowCustomAmount,
      expiresAt: this.expiresAt || undefined,
    }).subscribe({
      next: (qr) => void this.router.navigate(['/qr-payments', qr.id]),
      error: (err) => { this.error.set(err?.error?.message ?? 'Failed to create QR code.'); this.saving.set(false); },
    });
  }
}
