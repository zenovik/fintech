import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PayoutsApiService } from '../../services/payouts-api.service';
import { PAYOUT_METHOD_OPTIONS, PAYOUT_TYPE_OPTIONS } from '../../constants/payouts.constants';

@Component({
  selector: 'app-payout-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule],
  templateUrl: './payout-create.component.html',
  styleUrl: './payout-create.component.scss',
})
export class PayoutCreateComponent {
  private readonly api = inject(PayoutsApiService);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly error = signal('');

  merchantId = '';
  amount = '';
  settlementId = '';
  bankAccountId = '';
  payoutType = 'manual';
  payoutMethod = 'bank_transfer';
  scheduledAt = '';
  notes = '';

  readonly types = PAYOUT_TYPE_OPTIONS.filter((t) => t.key);
  readonly methods = PAYOUT_METHOD_OPTIONS.filter((m) => m.key);

  submit(): void {
    const mId = Number(this.merchantId);
    const amt = Number(this.amount);
    if (!mId || !amt || amt <= 0) {
      this.error.set('Valid merchant ID and amount are required.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.api.create({
      merchantId: mId,
      amount: amt,
      settlementId: this.settlementId ? Number(this.settlementId) : undefined,
      bankAccountId: this.bankAccountId ? Number(this.bankAccountId) : undefined,
      payoutType: this.payoutType,
      payoutMethod: this.payoutMethod,
      scheduledAt: this.scheduledAt || undefined,
      notes: this.notes || undefined,
    }).subscribe({
      next: (p) => void this.router.navigate(['/payouts', p.id]),
      error: () => { this.error.set('Failed to create payout.'); this.saving.set(false); },
    });
  }
}
