import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReportsStateService } from '../../services/reports-state.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { REPORT_STATUSES, PAGE_SIZE_OPTIONS } from '../../constants/reports.constants';

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule, DatePipe, TitleCasePipe],
  templateUrl: './reports-dashboard.component.html',
  styleUrl: './reports-dashboard.component.scss',
})
export class ReportsDashboardComponent implements OnInit {
  readonly state = inject(ReportsStateService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;
  readonly statuses = REPORT_STATUSES;
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  searchInput = '';
  statusFilter = '';
  showExportMenu = false;

  ngOnInit(): void {
    this.state.loadReports();
  }

  onSearch(): void { this.state.applySearch(this.searchInput.trim()); }

  onExport(format: string, reportId: number): void {
    this.showExportMenu = false;
    this.state.exportReport(reportId, format);
  }

  onRun(id: number): void { this.state.runReport(id); }

  pageRangeStart(): number {
    return (this.state.currentPage() - 1) * this.state.pageSize() + 1;
  }

  pageRangeEnd(): number {
    return Math.min(this.state.currentPage() * this.state.pageSize(), this.state.totalItems());
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.state.totalPages()) this.state.setPage(page);
  }
}
