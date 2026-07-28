import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { TransactionStateService } from '../../services/transaction-state.service';
import { RefundDialogComponent } from '../../components/refund-dialog/refund-dialog.component';
import { DisputeDialogComponent } from '../../components/dispute-dialog/dispute-dialog.component';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';

@Component({
  selector: 'app-transaction-details',
  standalone: true,
  imports: [CommonModule, RouterLink, MatProgressSpinnerModule, MatTabsModule, CurrencyPipe, DatePipe, TitleCasePipe],
  templateUrl: './transaction-details.component.html',
  styleUrl: './transaction-details.component.scss',
})
export class TransactionDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  readonly state = inject(TransactionStateService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  activeTab = 0;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.state.loadTransactionDetail(id);
  }

  openRefundDialog(): void {
    const tx = this.state.selectedTransaction();
    if (!tx) return;
    const ref = this.dialog.open(RefundDialogComponent, {
      width: '480px',
      data: { maxAmount: tx.amount, currency: tx.currency },
    });
    ref.afterClosed().subscribe((result: { amount: number; reason?: string } | undefined) => {
      if (result) this.state.processRefund(tx.id, result.amount, result.reason);
    });
  }

  openDisputeDialog(): void {
    const tx = this.state.selectedTransaction();
    if (!tx) return;
    const ref = this.dialog.open(DisputeDialogComponent, {
      width: '480px',
      data: { transactionRef: tx.transactionRef },
    });
    ref.afterClosed().subscribe((result: { reason: string } | undefined) => {
      if (result) this.state.createDispute(tx.id, result.reason);
    });
  }

  statusClass(code: string): string {
    if (code === 'settled') return 'settled';
    if (code === 'pending') return 'pending';
    if (code === 'failed') return 'failed';
    return 'flagged';
  }
}
