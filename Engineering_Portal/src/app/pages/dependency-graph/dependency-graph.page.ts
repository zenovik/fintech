import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { GraphViewerComponent } from '../../shared/components/graph-viewer/graph-viewer.component';
import { PortalDataService } from '../../core/services/portal-data.service';

@Component({
  selector: 'ep-dependency-graph-page',
  standalone: true,
  imports: [PageHeaderComponent, MatTabsModule, GraphViewerComponent],
  template: `
    <div class="ep-page">
      <ep-page-header title="Dependency Graph" subtitle="Backend, frontend, database, workers, Redis dependencies" />
      <mat-tab-group>
        <mat-tab label="Frontend">
          <ep-graph-viewer [nodes]="data.feCallgraph()?.nodes ?? []" [edges]="data.feCallgraph()?.edges ?? []" />
        </mat-tab>
        <mat-tab label="Backend">
          <ep-graph-viewer [nodes]="data.beCallgraph()?.nodes ?? []" [edges]="data.beCallgraph()?.edges ?? []" />
        </mat-tab>
        <mat-tab label="Knowledge">
          <ep-graph-viewer
            [nodes]="data.knowledgeGraph()?.nodes?.slice(0, 500) ?? []"
            [edges]="data.knowledgeGraph()?.edges?.slice(0, 800) ?? []"
          />
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DependencyGraphPage {
  readonly data = inject(PortalDataService);
}
