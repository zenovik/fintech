import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { GraphViewerComponent } from '../../shared/components/graph-viewer/graph-viewer.component';
import { PortalDataService } from '../../core/services/portal-data.service';

@Component({
  selector: 'ep-knowledge-graph-page',
  standalone: true,
  imports: [PageHeaderComponent, GraphViewerComponent, FormsModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="ep-page">
      <ep-page-header title="Knowledge Graph" subtitle="Interactive engineering knowledge graph — zoom, pan, filter, export" />
      <mat-form-field appearance="outline" class="filter">
        <mat-label>Filter nodes</mat-label>
        <input matInput [(ngModel)]="filter" (ngModelChange)="filterSig.set($event)" />
      </mat-form-field>
      <ep-graph-viewer [nodes]="nodes()" [edges]="data.knowledgeGraph()?.edges ?? []" />
    </div>
  `,
  styles: `.filter { width: 100%; max-width: 420px; margin-bottom: 1rem; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KnowledgeGraphPage {
  readonly data = inject(PortalDataService);
  readonly filterSig = signal('');
  filter = '';

  nodes() {
    const q = this.filterSig().toLowerCase();
    const all = this.data.knowledgeGraph()?.nodes ?? [];
    return q ? all.filter((n) => n.label.toLowerCase().includes(q) || n.type.toLowerCase().includes(q)) : all;
  }
}
