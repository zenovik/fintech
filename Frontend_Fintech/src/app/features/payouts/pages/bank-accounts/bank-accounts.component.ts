import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PayoutsApiService } from '../../services/payouts-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { BankAccountSummary } from '../../models/payouts.models';

@Component({
  selector: 'app-bank-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule, DatePipe],
  templateUrl: './bank-accounts.component.html',
  styleUrl: './bank-accounts.component.scss',
})
export class BankAccountsComponent implements OnInit {
  private readonly api = inject(PayoutsApiService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly accounts = signal<BankAccountSummary[]>([]);
  readonly saving = signal(false);

  merchantFilter = '';
  accountHolder = '';
  bankName = '';
  accountMasked = '';
  iban = '';
  currency = 'USD';

  ngOnInit(): void { this.load(); }

  load(): void {
    this.pageState.set('loading');
    this.api.listBankAccounts(this.merchantFilter ? Number(this.merchantFilter) : undefined).subscribe({
      next: (data) => { this.accounts.set(data); this.pageState.set('ready'); },
      error: () => this.pageState.set('error'),
    });
  }

  setPrimary(id: number): void {
    this.saving.set(true);
    this.api.setPrimaryBankAccount(id).subscribe({
      next: () => { this.load(); this.saving.set(false); },
      error: () => this.saving.set(false),
    });
  }

  addAccount(): void {
    const mId = Number(this.merchantFilter);
    if (!mId || !this.accountHolder.trim() || !this.accountMasked.trim()) return;
    this.saving.set(true);
    this.api.createBankAccount({
      merchantId: mId,
      accountHolder: this.accountHolder.trim(),
      bankName: this.bankName.trim() || undefined,
      accountNumberMasked: this.accountMasked.trim(),
      iban: this.iban.trim() || undefined,
      currency: this.currency,
      isPrimary: false,
    }).subscribe({
      next: () => {
        this.accountHolder = ''; this.bankName = ''; this.accountMasked = ''; this.iban = '';
        this.load(); this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }
}
