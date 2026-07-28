import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PayoutsApiService } from '../../services/payouts-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { PayoutDetail } from '../../models/payouts.models';

@Component({
  selector: 'app-payout-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule, DatePipe, CurrencyPipe, TitleCasePipe],
  templateUrl: './payout-details.component.html',
  styleUrl: './payout-details.component.scss',
})
export class PayoutDetailsComponent implements OnInit {
  private readonly api = inject(PayoutsApiService);
  private readonly route = inject(ActivatedRoute);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly payout = signal<PayoutDetail | null>(null);
  readonly saving = signal(false);
  rejectReason = '';

  ngOnInit(): void { this.load(); }

  load(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.pageState.set('loading');
    this.api.getById(id).subscribe({
      next: (data) => { this.payout.set(data); this.pageState.set('ready'); },
      error: () => this.pageState.set('error'),
    });
  }

  approve(): void {
    const p = this.payout();
    if (!p) return;
    this.saving.set(true);
    this.api.approve(p.id).subscribe({
      next: (updated) => { this.payout.set(updated); this.saving.set(false); },
      error: () => this.saving.set(false),
    });
  }

  reject(): void {
    const p = this.payout();
    if (!p || !this.rejectReason.trim()) return;
    this.saving.set(true);
    this.api.reject(p.id, this.rejectReason.trim()).subscribe({
      next: (updated) => { this.payout.set(updated); this.saving.set(false); this.rejectReason = ''; },
      error: () => this.saving.set(false),
    });
  }

  retry(): void {
    const p = this.payout();
    if (!p) return;
    this.saving.set(true);
    this.api.retry(p.id).subscribe({
      next: (updated) => { this.payout.set(updated); this.saving.set(false); },
      error: () => this.saving.set(false),
    });
  }

  badgeClass(value: string): string { return `po-badge po-badge--${value}`; }
  get p() { return this.payout()!; }
}
