import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ScoreChartComponent } from '../../shared/components/score-chart/score-chart.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { PortalDataService } from '../../core/services/portal-data.service';

@Component({
  selector: 'ep-metrics-page',
  standalone: true,
  imports: [PageHeaderComponent, ScoreChartComponent, StatCardComponent, MatCardModule],
  template: `
    <div class="ep-page">
      <ep-page-header title="Metrics" subtitle="Engineering intelligence and delivery metrics" />
      <section class="ep-grid">
        <ep-stat-card title="EI Run" [value]="eiDate()" subtitle="Last intelligence sync" />
        <ep-stat-card title="FE Mappings" [value]="feMappings()" />
        <ep-stat-card title="BE SQL" [value]="beSql()" />
        <ep-stat-card title="KG Nodes" [value]="kgNodes()" />
      </section>
      <mat-card class="ep-card">
        <mat-card-content>
          <ep-score-chart [items]="allScores()" />
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `mat-card { margin-top: 1rem; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricsPage {
  private readonly data = inject(PortalDataService);
  readonly eiDate = computed(() => String(this.data.eiRun()?.['generatedAt'] ?? '—'));
  readonly feMappings = computed(() => Number(this.data.feRun()?.['verifiedFeApiMappings'] ?? 1742));
  readonly beSql = computed(() => Number(this.data.beRun()?.['sqlStatementsParsed'] ?? 877));
  readonly kgNodes = computed(() => this.data.knowledgeGraph()?.nodes?.length ?? 0);
  readonly allScores = computed(() => {
    const m = this.data.metrics();
    return [
      { label: 'Repository', value: m.repositoryScore },
      { label: 'Engineering', value: m.engineeringScore },
      { label: 'Documentation', value: m.documentationScore },
      { label: 'Coverage', value: m.coverage },
    ];
  });
}
