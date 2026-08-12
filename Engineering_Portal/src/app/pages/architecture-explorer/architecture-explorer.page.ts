import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { GraphViewerComponent } from '../../shared/components/graph-viewer/graph-viewer.component';
import { PortalDataService } from '../../core/services/portal-data.service';

@Component({
  selector: 'ep-architecture-explorer-page',
  standalone: true,
  imports: [PageHeaderComponent, GraphViewerComponent, MatCardModule],
  template: `
    <div class="ep-page">
      <ep-page-header title="Architecture Explorer" subtitle="System layers, modules, and cross-cutting concerns" />
      <mat-card class="ep-card">
        <mat-card-content>
          <ep-graph-viewer
            [nodes]="data.knowledgeGraph()?.nodes?.slice(0, 400) ?? []"
            [edges]="data.knowledgeGraph()?.edges?.slice(0, 600) ?? []"
          />
        </mat-card-content>
      </mat-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchitectureExplorerPage {
  readonly data = inject(PortalDataService);
}
