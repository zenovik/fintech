import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SubscriptionsApiService } from '../../services/subscriptions-api.service';
import { BILLING_INTERVAL_OPTIONS, CURRENCY_OPTIONS } from '../../constants/subscriptions.constants';

@Component({
  selector: 'app-plan-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule],
  templateUrl: './plan-create.component.html',
  styleUrl: './plan-create.component.scss',
})
export class PlanCreateComponent {
  private readonly api = inject(SubscriptionsApiService);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly error = signal('');

  merchantId = '';
  name = '';
  description = '';
  price = '';
  currency = 'USD';
  billingInterval = 'monthly';
  trialDays = '0';

  readonly currencies = CURRENCY_OPTIONS;
  readonly intervals = BILLING_INTERVAL_OPTIONS;

  submit(): void {
    const mId = Number(this.merchantId);
    const p = Number(this.price);
    if (!mId || !this.name.trim() || !p || p <= 0) {
      this.error.set('Merchant ID, name, and price are required.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.api.createPlan({
      merchantId: mId,
      name: this.name.trim(),
      description: this.description.trim() || undefined,
      price: p,
      currency: this.currency,
      billingInterval: this.billingInterval,
      trialDays: Number(this.trialDays) || 0,
    }).subscribe({
      next: () => void this.router.navigate(['/subscriptions/plans']),
      error: (err) => { this.error.set(err?.error?.message ?? 'Failed to create plan.'); this.saving.set(false); },
    });
  }
}
