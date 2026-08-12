import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { ScoreChartComponent } from '../../shared/components/score-chart/score-chart.component';
import { PortalDataService } from '../../core/services/portal-data.service';

@Component({
  selector: 'ep-dashboard-page',
  standalone: true,
  imports: [PageHeaderComponent, StatCardComponent, ScoreChartComponent, MatCardModule],
  template: `
    <div class="ep-page">
      <ep-page-header title="Dashboard" subtitle="Enterprise engineering intelligence overview" />
      <section class="ep-grid">
        <ep-stat-card title="Repository Score" [value]="m().repositoryScore" />
        <ep-stat-card title="Security Score" [value]="m().securityScore" />
        <ep-stat-card title="Documentation Score" [value]="m().documentationScore" />
        <ep-stat-card title="Architecture Score" [value]="m().architectureScore" />
        <ep-stat-card title="Engineering Score" [value]="m().engineeringScore" />
        <ep-stat-card title="Coverage" [value]="m().coverage + '%'" />
      </section>

      <section class="ep-grid metrics-grid">
        <ep-stat-card title="Files" [value]="m().files" />
        <ep-stat-card title="Endpoints" [value]="m().endpoints" />
        <ep-stat-card title="Tables" [value]="m().tables" />
        <ep-stat-card title="Components" [value]="m().components" />
        <ep-stat-card title="Workers" [value]="m().workers" />
        <ep-stat-card title="Tests" [value]="m().tests" />
        <ep-stat-card title="Permissions" [value]="m().permissions" />
        <ep-stat-card title="Redis" [value]="m().redis" />
      </section>

      <mat-card class="ep-card chart-card">
        <mat-card-header><mat-card-title>Score Breakdown</mat-card-title></mat-card-header>
        <mat-card-content>
          <ep-score-chart [items]="scores()" />
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .metrics-grid {
      margin-top: 1rem;
    }
    .chart-card {
      margin-top: 1.5rem;
      padding: 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  private readonly data = inject(PortalDataService);
  readonly m = this.data.metrics;
  readonly scores = computed(() => {
    const m = this.m();
    return [
      { label: 'Repository', value: m.repositoryScore },
      { label: 'Security', value: m.securityScore },
      { label: 'Documentation', value: m.documentationScore },
      { label: 'Architecture', value: m.architectureScore },
      { label: 'Engineering', value: m.engineeringScore },
      { label: 'Coverage', value: m.coverage },
    ];
  });
}
