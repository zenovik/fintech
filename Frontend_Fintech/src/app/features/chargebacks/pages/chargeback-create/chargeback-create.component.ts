import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChargebacksApiService } from '../../services/chargebacks-api.service';
import { CHARGEBACK_NETWORK_OPTIONS, CHARGEBACK_REASON_OPTIONS } from '../../constants/chargebacks.constants';

@Component({
  selector: 'app-chargeback-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule],
  templateUrl: './chargeback-create.component.html',
  styleUrl: './chargeback-create.component.scss',
})
export class ChargebackCreateComponent {
  private readonly api = inject(ChargebacksApiService);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly error = signal('');

  transactionId = '';
  reason = '';
  reasonCode = 'other';
  cardNetwork = 'visa';
  amount = '';

  readonly reasons = CHARGEBACK_REASON_OPTIONS.filter((r) => r.key);
  readonly networks = CHARGEBACK_NETWORK_OPTIONS.filter((n) => n.key);

  submit(): void {
    const txId = Number(this.transactionId);
    if (!txId || !this.reason.trim()) {
      this.error.set('Transaction ID and reason are required.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.api.create({
      transactionId: txId,
      reason: this.reason.trim(),
      reasonCode: this.reasonCode,
      cardNetwork: this.cardNetwork,
      amount: this.amount ? Number(this.amount) : undefined,
    }).subscribe({
      next: (c) => void this.router.navigate(['/chargebacks', c.id]),
      error: () => { this.error.set('Failed to open chargeback.'); this.saving.set(false); },
    });
  }
}
