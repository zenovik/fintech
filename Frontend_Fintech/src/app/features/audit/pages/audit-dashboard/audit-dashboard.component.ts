import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuditStateService } from '../../services/audit-state.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import {
  DATE_RANGE_OPTIONS,
  MODULE_OPTIONS,
  RISK_OPTIONS,
  ACTION_BADGE_CLASSES,
} from '../../constants/audit.constants';
import { AuditLogItem } from '../../models/audit.models';

@Component({
  selector: 'app-audit-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, DatePipe],
  providers: [AuditStateService],
  templateUrl: './audit-dashboard.component.html',
  styleUrl: './audit-dashboard.component.scss',
})
export class AuditDashboardComponent implements OnInit, OnDestroy {
  readonly state = inject(AuditStateService);
  readonly rbac = inject(RbacService);
  readonly router = inject(Router);
  readonly perms = PERMISSIONS;
  readonly Math = Math;

  searchInput = '';
  readonly dateRanges = DATE_RANGE_OPTIONS;
  readonly modules = MODULE_OPTIONS;
  readonly risks = RISK_OPTIONS;
  readonly badgeClasses = ACTION_BADGE_CLASSES;

  ngOnInit(): void {
    this.state.loadLogs();
  }

  ngOnDestroy(): void {
    this.state.destroy();
  }

  onSearch(): void {
    this.state.applySearch(this.searchInput.trim());
  }

  onModuleChange(value: string): void {
    this.state.applyModuleFilter(value);
  }

  onRiskChange(value: string): void {
    this.state.applyRiskFilter(value);
  }

  onDateRangeChange(value: string): void {
    this.state.applyDateRange(value);
  }

  resetFilters(): void {
    this.searchInput = '';
    this.state.resetFilters();
  }

  toggleRefresh(): void {
    this.state.toggleLiveRefresh(!this.state.liveRefresh());
    if (this.state.liveRefresh()) this.state.loadLogs();
  }

  exportCsv(): void {
    this.state.exportLogs();
  }

  openLog(log: AuditLogItem): void {
    this.router.navigate(['/audit', log.id]);
  }

  getInitials(name: string | null): string {
    if (!name) return 'SY';
    return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  }

  getBadgeClass(module: string): string {
    return this.badgeClasses[module] ?? 'audit-badge--default';
  }

  getRiskClass(level: string): string {
    return `audit-risk--${level}`;
  }

  criticalAlerts(): AuditLogItem[] {
    return this.state.logs().filter((l) => l.riskLevel === 'critical' || l.riskLevel === 'high').slice(0, 3);
  }

  riskBreakdown(): { level: string; count: number; pct: number }[] {
    const logs = this.state.logs();
    const levels = ['critical', 'high', 'medium', 'low'];
    const total = this.state.stats().total || 1;
    return levels.map((level) => {
      const count = logs.filter((l) => l.riskLevel === level).length;
      return { level, count, pct: Math.min(100, Math.round((count / total) * 100) || 0) };
    });
  }

  pageNumbers(): number[] {
    const total = this.state.totalPages();
    const current = this.state.page();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }
}
