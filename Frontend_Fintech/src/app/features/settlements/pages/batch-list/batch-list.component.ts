import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SettlementStateService } from '../../services/settlement-state.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { PAGE_SIZE_OPTIONS } from '../../constants/settlement.constants';

@Component({
  selector: 'app-batch-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule, DatePipe, CurrencyPipe, TitleCasePipe],
  templateUrl: './batch-list.component.html',
  styleUrl: './batch-list.component.scss',
})
export class BatchListComponent implements OnInit {
  readonly state = inject(SettlementStateService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  activeStatus = '';

  ngOnInit(): void {
    this.state.loadBatches();
    this.state.loadStatistics();
  }

  statusClass(code: string): string {
    if (code === 'completed' || code === 'processed') return 'processed';
    if (code === 'pending') return 'pending';
    if (code === 'processing') return 'processing';
    if (code === 'failed') return 'failed';
    return 'reversed';
  }

  statusIcon(code: string): string {
    const cls = this.statusClass(code);
    if (cls === 'processed') return 'check_circle';
    if (cls === 'processing') return 'progress_activity';
    if (cls === 'failed') return 'cancel';
    if (cls === 'pending') return 'schedule';
    return 'sync';
  }

  filterStatus(status: string): void {
    this.activeStatus = status;
    this.state.applyBatchStatusFilter(status);
  }

  onExport(): void {
    this.state.exportSettlements('csv');
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.state.batchTotalPages()) this.state.setBatchPage(p);
  }

  pageStart(): number {
    return (this.state.batchCurrentPage() - 1) * this.state.batchPageSize() + 1;
  }

  pageEnd(): number {
    return Math.min(this.state.batchCurrentPage() * this.state.batchPageSize(), this.state.batchTotalItems());
  }
}
