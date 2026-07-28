import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SubscriptionsApiService } from '../../services/subscriptions-api.service';
import { SubscriptionPlan } from '../../models/subscriptions.models';
import { DEFAULT_PAGE_SIZE } from '../../constants/subscriptions.constants';

@Component({
  selector: 'app-subscription-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule],
  templateUrl: './subscription-create.component.html',
  styleUrl: './subscription-create.component.scss',
})
export class SubscriptionCreateComponent implements OnInit {
  private readonly api = inject(SubscriptionsApiService);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly error = signal('');
  readonly plans = signal<SubscriptionPlan[]>([]);

  merchantId = '';
  customerId = '';
  planId = '';
  startDate = '';

  ngOnInit(): void {
    this.api.listPlans({ page: 1, pageSize: DEFAULT_PAGE_SIZE }).subscribe({
      next: (data) => this.plans.set(data.items),
      error: () => {},
    });
  }

  submit(): void {
    const mId = Number(this.merchantId);
    const cId = Number(this.customerId);
    const pId = Number(this.planId);
    if (!mId || !cId || !pId) {
      this.error.set('Merchant ID, customer ID, and plan are required.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.api.create({
      merchantId: mId,
      customerId: cId,
      planId: pId,
      startDate: this.startDate || undefined,
    }).subscribe({
      next: (sub) => void this.router.navigate(['/subscriptions', sub.id]),
      error: (err) => { this.error.set(err?.error?.message ?? 'Failed to create subscription.'); this.saving.set(false); },
    });
  }
}
