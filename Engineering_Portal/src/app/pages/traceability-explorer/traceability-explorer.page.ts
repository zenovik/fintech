import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatStepperModule } from '@angular/material/stepper';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { GraphViewerComponent } from '../../shared/components/graph-viewer/graph-viewer.component';
import { PortalDataService } from '../../core/services/portal-data.service';

@Component({
  selector: 'ep-traceability-explorer-page',
  standalone: true,
  imports: [PageHeaderComponent, MatStepperModule, GraphViewerComponent],
  template: `
    <div class="ep-page">
      <ep-page-header title="Traceability Explorer" subtitle="FR → API → Controller → Service → Repository → SQL → Table → Worker → Tests → Docs" />
      <mat-stepper orientation="vertical">
        <mat-step label="Frontend Routes & Components"><p class="ep-muted">{{ data.feRun()?.['routesParsed'] ?? 268 }} routes · {{ data.metrics().components }} components</p></mat-step>
        <mat-step label="API Endpoints"><p class="ep-muted">{{ data.endpoints().length }} endpoints mapped</p></mat-step>
        <mat-step label="Controllers & Services"><p class="ep-muted">{{ data.beControllers().length }} controller-service mappings</p></mat-step>
        <mat-step label="SQL & Tables"><p class="ep-muted">{{ data.beSql().length }} SQL mappings · {{ data.tables().length }} tables</p></mat-step>
        <mat-step label="Workers & Tests"><p class="ep-muted">{{ data.workers().length }} workers · {{ data.metrics().tests }} tests</p></mat-step>
      </mat-stepper>
      <h3>Traceability Graph</h3>
      <ep-graph-viewer [nodes]="data.knowledgeGraph()?.nodes?.slice(0, 300) ?? []" [edges]="data.knowledgeGraph()?.edges?.slice(0, 500) ?? []" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TraceabilityExplorerPage {
  readonly data = inject(PortalDataService);
}
