import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RefundsApiService } from '../../services/refunds-api.service';

@Component({
  selector: 'app-refund-request',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule],
  templateUrl: './refund-request.component.html',
  styleUrl: './refund-request.component.scss',
})
export class RefundRequestComponent {
  private readonly api = inject(RefundsApiService);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly error = signal('');

  transactionId = '';
  amount = '';
  reason = '';

  submit(): void {
    const txId = Number(this.transactionId);
    const amt = Number(this.amount);
    if (!txId || !amt || amt <= 0) {
      this.error.set('Valid transaction ID and amount are required.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.api.create({ transactionId: txId, amount: amt, reason: this.reason || undefined }).subscribe({
      next: (r) => void this.router.navigate(['/refunds', r.id]),
      error: () => { this.error.set('Failed to submit refund request.'); this.saving.set(false); },
    });
  }
}
