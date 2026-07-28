import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PaymentLinksApiService } from '../../services/payment-links-api.service';
import { CURRENCY_OPTIONS } from '../../constants/payment-links.constants';

@Component({
  selector: 'app-payment-link-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule],
  templateUrl: './payment-link-create.component.html',
  styleUrl: './payment-link-create.component.scss',
})
export class PaymentLinkCreateComponent {
  private readonly api = inject(PaymentLinksApiService);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly error = signal('');

  merchantId = '';
  customerId = '';
  title = '';
  description = '';
  amount = '';
  currency = 'USD';
  allowCustomAmount = false;
  expiresAt = '';
  maxUsage = '';
  redirectUrl = '';
  successUrl = '';
  cancelUrl = '';

  readonly currencies = CURRENCY_OPTIONS;

  submit(): void {
    const mId = Number(this.merchantId);
    if (!mId || !this.title.trim()) {
      this.error.set('Merchant ID and title are required.');
      return;
    }
    if (!this.allowCustomAmount && (!this.amount || Number(this.amount) <= 0)) {
      this.error.set('Amount is required unless custom amounts are allowed.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.api.create({
      merchantId: mId,
      customerId: this.customerId ? Number(this.customerId) : undefined,
      title: this.title.trim(),
      description: this.description.trim() || undefined,
      amount: this.allowCustomAmount ? undefined : Number(this.amount),
      currency: this.currency,
      allowCustomAmount: this.allowCustomAmount,
      expiresAt: this.expiresAt || undefined,
      maxUsage: this.maxUsage ? Number(this.maxUsage) : undefined,
      redirectUrl: this.redirectUrl.trim() || undefined,
      successUrl: this.successUrl.trim() || undefined,
      cancelUrl: this.cancelUrl.trim() || undefined,
    }).subscribe({
      next: (link) => void this.router.navigate(['/payment-links', link.id]),
      error: () => { this.error.set('Failed to create payment link.'); this.saving.set(false); },
    });
  }
}
