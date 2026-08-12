import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PortalDataService } from '../../core/services/portal-data.service';

@Component({
  selector: 'ep-impact-analysis-page',
  standalone: true,
  imports: [PageHeaderComponent, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule, JsonPipe],
  template: `
    <div class="ep-page">
      <ep-page-header title="Impact Analysis" subtitle="Affected files, endpoints, tests, docs, tables, workers" />
      <div class="controls">
        <mat-form-field appearance="outline">
          <mat-label>Entity type</mat-label>
          <mat-select [(ngModel)]="entityType" (ngModelChange)="entityTypeSig.set($event)">
            @for (t of types; track t) {
              <mat-option [value]="t">{{ t }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="grow">
          <mat-label>Search entity</mat-label>
          <input matInput [(ngModel)]="query" (ngModelChange)="querySig.set($event)" />
        </mat-form-field>
      </div>
      <mat-card class="ep-card">
        <mat-card-content>
          <pre>{{ report() | json }}</pre>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .controls {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }
    .grow {
      flex: 1;
      min-width: 240px;
    }
    pre {
      white-space: pre-wrap;
      font-size: 0.85rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpactAnalysisPage {
  readonly data = inject(PortalDataService);
  readonly types = ['Endpoint', 'Table', 'Component', 'Controller', 'Worker', 'Permission'];
  readonly entityTypeSig = signal('Endpoint');
  readonly querySig = signal('');
  entityType = 'Endpoint';
  query = '';

  report(): unknown {
    const q = this.querySig().toLowerCase();
    const reports = this.data.impactReports();
    if (!q) return { hint: 'Enter an entity to analyze impact from engineering-knowledge reports.' };
    const match = Object.entries(reports).find(([k]) => k.toLowerCase().includes(q));
    if (match) return match[1];
    if (this.entityTypeSig() === 'Endpoint') {
      const ep = this.data.endpoints().find((e) => e.fullPath.toLowerCase().includes(q));
      return ep ? { endpoint: ep, affectedTables: this.data.tables().filter((t) => t.includes(q.split('/').pop() ?? '')) } : { message: 'No match' };
    }
    return { message: 'No impact report found', query: q, type: this.entityTypeSig() };
  }
}
