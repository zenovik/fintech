import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule, DecimalPipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReportsStateService } from '../../services/reports-state.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { PERIOD_TYPES } from '../../constants/reports.constants';
import { ReportPeriod } from '../../constants/reports.constants';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule, DecimalPipe, TitleCasePipe],
  templateUrl: './analytics-dashboard.component.html',
  styleUrl: './analytics-dashboard.component.scss',
})
export class AnalyticsDashboardComponent implements OnInit {
  readonly state = inject(ReportsStateService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;
  readonly periods = PERIOD_TYPES;

  showExportMenu = false;

  readonly revenuePath = computed(() => this.buildAreaPath(this.state.revenueChart()?.actual ?? []));
  readonly revenueLinePoints = computed(() => this.buildLinePoints(this.state.revenueChart()?.actual ?? []));
  readonly donutSegments = computed(() => this.buildDonutSegments(this.state.paymentMethods()));

  ngOnInit(): void { this.state.loadAnalytics(); }

  onPeriodChange(period: ReportPeriod): void { this.state.setPeriod(period); }

  onExport(format: string): void {
    this.showExportMenu = false;
    this.state.exportAnalytics(format);
  }

  private buildLinePoints(values: number[]): string {
    if (!values.length) return '';
    const w = 600; const h = 200; const max = Math.max(...values, 1);
    const step = w / (values.length - 1 || 1);
    return values.map((v, i) => `${i * step},${h - (v / max) * (h - 20)}`).join(' ');
  }

  private buildAreaPath(values: number[]): string {
    if (!values.length) return '';
    const w = 600; const h = 200; const max = Math.max(...values, 1);
    const step = w / (values.length - 1 || 1);
    const pts = values.map((v, i) => `${i * step},${h - (v / max) * (h - 20)}`);
    return `M0,${h} L${pts.join(' L')} L${w},${h} Z`;
  }

  private buildDonutSegments(segments: { percentage: number }[]): { offset: number; dash: number; color: string }[] {
    const colors = ['#3b5bdb', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];
    let offset = 0;
    return segments.map((s, i) => {
      const dash = (s.percentage / 100) * 251.2;
      const seg = { offset, dash, color: colors[i % colors.length] };
      offset += dash;
      return seg;
    });
  }
}
