import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MerchantStateService } from '../../services/merchant-state.service';
import { TransactionApiService } from '../../../transactions/services/transaction-api.service';
import { SettlementApiService } from '../../../settlements/services/settlement-api.service';
import { TransactionListItem } from '../../../transactions/models/transaction.models';
import { SettlementListItem } from '../../../settlements/models/settlement.models';
import { MerchantStatusDialogComponent } from '../../components/merchant-status-dialog/merchant-status-dialog.component';
import { MerchantStatus } from '../../constants/merchant.constants';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';

@Component({
  selector: 'app-merchant-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatDialogModule,
    DatePipe,
    CurrencyPipe,
    TitleCasePipe,
  ],
  templateUrl: './merchant-details.component.html',
  styleUrl: './merchant-details.component.scss',
})
export class MerchantDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly txnApi = inject(TransactionApiService);
  private readonly settlementApi = inject(SettlementApiService);
  readonly state = inject(MerchantStateService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  readonly merchantTransactions = signal<TransactionListItem[]>([]);
  readonly merchantSettlements = signal<SettlementListItem[]>([]);
  readonly txnLoading = signal(false);
  readonly stlLoading = signal(false);
  readonly activeTab = 0;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.state.loadMerchantDetail(id);
      this.loadMerchantTransactions(id);
      this.loadMerchantSettlements(id);
    }
  }

  loadMerchantSettlements(merchantId: number): void {
    this.stlLoading.set(true);
    this.settlementApi.list({ page: 1, pageSize: 10, merchantId }).subscribe({
      next: (data) => {
        this.merchantSettlements.set(data.items);
        this.stlLoading.set(false);
      },
      error: () => {
        this.merchantSettlements.set([]);
        this.stlLoading.set(false);
      },
    });
  }

  loadMerchantTransactions(merchantId: number): void {
    this.txnLoading.set(true);
    this.txnApi.list({ page: 1, pageSize: 10, merchantId }).subscribe({
      next: (data) => {
        this.merchantTransactions.set(data.items);
        this.txnLoading.set(false);
      },
      error: () => {
        this.merchantTransactions.set([]);
        this.txnLoading.set(false);
      },
    });
  }

  openStatusDialog(): void {
    const merchant = this.state.selectedMerchant();
    if (!merchant) return;

    const ref = this.dialog.open(MerchantStatusDialogComponent, {
      width: '480px',
      data: { currentStatus: merchant.status },
    });

    ref.afterClosed().subscribe((result: { status: MerchantStatus; reason?: string } | undefined) => {
      if (result) {
        this.state.updateStatus(merchant.id, result.status, result.reason);
      }
    });
  }

  confirmDelete(): void {
    const merchant = this.state.selectedMerchant();
    if (!merchant) return;
    if (confirm(`Delete merchant "${merchant.displayName}"? This action cannot be undone.`)) {
      this.state.deleteMerchant(merchant.id);
    }
  }

  primaryAddress(): string {
    const m = this.state.selectedMerchant();
    const addr = m?.addresses?.find((a) => a.isPrimary) ?? m?.addresses?.[0];
    if (!addr) return '—';
    const parts = [addr.line1, addr.line2, addr.city, addr.stateProvince, addr.postalCode, addr.countryCode].filter(Boolean);
    return parts.join(', ');
  }
}
