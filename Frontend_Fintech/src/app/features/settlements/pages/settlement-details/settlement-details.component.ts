import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog } from '@angular/material/dialog';
import { SettlementStateService } from '../../services/settlement-state.service';
import { ReversalDialogComponent } from '../../components/reversal-dialog/reversal-dialog.component';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';

@Component({
  selector: 'app-settlement-details',
  standalone: true,
  imports: [CommonModule, RouterLink, MatProgressSpinnerModule, MatTabsModule, CurrencyPipe, DatePipe, TitleCasePipe],
  templateUrl: './settlement-details.component.html',
  styleUrl: './settlement-details.component.scss',
})
export class SettlementDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  readonly state = inject(SettlementStateService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  activeTab = 0;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.state.loadSettlementDetail(id);
  }

  openReversalDialog(): void {
    const s = this.state.selectedSettlement();
    if (!s) return;
    const ref = this.dialog.open(ReversalDialogComponent, {
      width: '480px',
      data: { maxAmount: s.amount, currency: s.currency, settlementRef: s.settlementRef },
    });
    ref.afterClosed().subscribe((result: { amount: number; reason: string } | undefined) => {
      if (result) this.state.processReversal(s.id, result.amount, result.reason);
    });
  }

  statusClass(code: string): string {
    if (code === 'processed') return 'processed';
    if (code === 'pending') return 'pending';
    if (code === 'processing') return 'processing';
    if (code === 'failed') return 'failed';
    return 'reversed';
  }
}
