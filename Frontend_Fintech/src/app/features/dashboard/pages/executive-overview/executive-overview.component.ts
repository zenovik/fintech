import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DashboardStateService } from '../../services/dashboard-state.service';
import { DashboardAiSessionService } from '../../services/dashboard-ai-session.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { DASHBOARD_PERIODS, DashboardPeriod, PAGE_SIZE_OPTIONS } from '../../constants/dashboard.constants';
import { DashboardAiWidgetComponent } from '../../components/dashboard-ai-widget/dashboard-ai-widget.component';

@Component({
  selector: 'app-executive-overview',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, DecimalPipe, DatePipe, RouterLink, DashboardAiWidgetComponent],
  templateUrl: './executive-overview.component.html',
  styleUrl: './executive-overview.component.scss',
})
export class ExecutiveOverviewComponent implements OnInit {
  readonly state = inject(DashboardStateService);
  readonly dashboardAi = inject(DashboardAiSessionService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;
  readonly canUseDashboardAi = computed(() =>
    this.rbac.hasPermission(this.perms.AI_VIEW) && this.rbac.hasPermission(this.perms.DASHBOARD_READ),
  );
  readonly showPlatformMerchantsKpi = computed(() => this.rbac.hasPermission(this.perms.MERCHANTS_READ));
  readonly showSettlementWidget = computed(() => this.rbac.hasPermission(this.perms.SETTLEMENTS_READ));
  readonly showOperationsWidget = computed(() => this.rbac.hasPermission(this.perms.OPERATIONS_READ));

  readonly periods = DASHBOARD_PERIODS;
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  searchInput = '';
  showFabMenu = false;

  readonly revenuePath = computed(() => this.buildAreaPath(this.state.revenueChart()?.actual ?? []));
  readonly revenueLinePoints = computed(() => this.buildLinePoints(this.state.revenueChart()?.actual ?? []));
  readonly donutSegments = computed(() => this.buildDonutSegments(this.state.paymentMethods()?.segments ?? []));

  ngOnInit(): void {
    this.state.loadDashboard();
  }

  onPeriodChange(period: DashboardPeriod): void {
    this.state.setPeriod(period);
  }

  onSearch(): void {
    this.state.searchTransactions(this.searchInput.trim());
  }

  onExport(): void {
    this.state.exportReport();
  }

  onRetry(): void {
    this.state.retry();
  }

  openDashboardAi(): void {
    this.dashboardAi.openDrawer();
  }

  toggleFabMenu(): void {
    this.showFabMenu = !this.showFabMenu;
  }

  getStatusClass(badge: string): string {
    const map: Record<string, string> = {
      green: 'status--settled',
      amber: 'status--pending',
      red: 'status--failed',
      error: 'status--flagged',
      blue: 'status--pending',
    };
    return map[badge] ?? 'status--pending';
  }

  private buildLinePoints(values: number[]): string {
    if (!values.length) return '';
    const w = 600;
    const h = 200;
    const max = Math.max(...values, 1);
    const step = w / (values.length - 1 || 1);
    return values
      .map((v, i) => `${i * step},${h - (v / max) * (h - 20)}`)
      .join(' ');
  }

  private buildAreaPath(values: number[]): string {
    if (!values.length) return '';
    const w = 600;
    const h = 200;
    const max = Math.max(...values, 1);
    const step = w / (values.length - 1 || 1);
    const points = values.map((v, i) => {
      const x = i * step;
      const y = h - (v / max) * (h - 20);
      return `${x},${y}`;
    });
    return `M0,${h} L${points.join(' L')} L${w},${h} Z`;
  }

  private buildDonutSegments(
    segments: { percentage: number; name: string }[],
  ): { offset: number; dash: number; color: string }[] {
    const colors = ['#003d9b', '#b2c5ff', '#dae2fd'];
    const circumference = 251.2;
    let offset = 0;
    return segments.map((s, i) => {
      const dash = (s.percentage / 100) * circumference;
      const seg = { offset, dash, color: colors[i % colors.length] };
      offset += dash;
      return seg;
    });
  }
}
