import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PaymentLinksApiService } from '../../services/payment-links-api.service';
import { PaymentLinkDetail } from '../../models/payment-links.models';
import { CURRENCY_OPTIONS } from '../../constants/payment-links.constants';

@Component({
  selector: 'app-payment-link-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule],
  templateUrl: './payment-link-edit.component.html',
  styleUrl: './payment-link-edit.component.scss',
})
export class PaymentLinkEditComponent implements OnInit {
  private readonly api = inject(PaymentLinksApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly saving = signal(false);
  readonly error = signal('');
  linkId = 0;

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

  ngOnInit(): void {
    this.linkId = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getById(this.linkId).subscribe({
      next: (link) => this.populate(link),
      error: () => this.pageState.set('error'),
    });
  }

  private populate(link: PaymentLinkDetail): void {
    this.merchantId = String(link.merchantId);
    this.customerId = link.customerId ? String(link.customerId) : '';
    this.title = link.title;
    this.description = link.description ?? '';
    this.amount = link.amount != null ? String(link.amount) : '';
    this.currency = link.currency;
    this.allowCustomAmount = link.allowCustomAmount;
    this.expiresAt = link.expiresAt ? link.expiresAt.slice(0, 16) : '';
    this.maxUsage = link.maxUsage != null ? String(link.maxUsage) : '';
    this.redirectUrl = link.redirectUrl ?? '';
    this.successUrl = link.successUrl ?? '';
    this.cancelUrl = link.cancelUrl ?? '';
    this.pageState.set('ready');
  }

  submit(): void {
    if (!this.title.trim()) {
      this.error.set('Title is required.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.api.update(this.linkId, {
      merchantId: Number(this.merchantId),
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
      next: () => void this.router.navigate(['/payment-links', this.linkId]),
      error: () => { this.error.set('Failed to update payment link.'); this.saving.set(false); },
    });
  }
}
