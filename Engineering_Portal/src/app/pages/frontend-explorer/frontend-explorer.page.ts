import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { GraphViewerComponent } from '../../shared/components/graph-viewer/graph-viewer.component';
import { PortalDataService } from '../../core/services/portal-data.service';

@Component({
  selector: 'ep-frontend-explorer-page',
  standalone: true,
  imports: [PageHeaderComponent, MatTabsModule, MatTableModule, GraphViewerComponent],
  template: `
    <div class="ep-page">
      <ep-page-header title="Frontend Explorer" subtitle="Components, services, routes, and HttpClient API calls" />
      <mat-tab-group>
        <mat-tab label="Call Graph">
          <ep-graph-viewer
            [nodes]="data.feCallgraph()?.nodes ?? []"
            [edges]="data.feCallgraph()?.edges ?? []"
          />
        </mat-tab>
        <mat-tab label="HttpClient Calls">
          <table mat-table [dataSource]="httpRows()" class="tbl">
            <ng-container matColumnDef="component">
              <th mat-header-cell *matHeaderCellDef>Component</th>
              <td mat-cell *matCellDef="let row">{{ row.component }}</td>
            </ng-container>
            <ng-container matColumnDef="method">
              <th mat-header-cell *matHeaderCellDef>Method</th>
              <td mat-cell *matCellDef="let row">{{ row.method }}</td>
            </ng-container>
            <ng-container matColumnDef="url">
              <th mat-header-cell *matHeaderCellDef>URL</th>
              <td mat-cell *matCellDef="let row">{{ row.url }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols"></tr>
          </table>
        </mat-tab>
        <mat-tab label="Services">
          <table mat-table [dataSource]="serviceRows()" class="tbl">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Service</th>
              <td mat-cell *matCellDef="let row">{{ row.name }}</td>
            </ng-container>
            <ng-container matColumnDef="file">
              <th mat-header-cell *matHeaderCellDef>File</th>
              <td mat-cell *matCellDef="let row">{{ row.file }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="svcCols"></tr>
            <tr mat-row *matRowDef="let row; columns: svcCols"></tr>
          </table>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: `.tbl { width: 100%; margin-top: 1rem; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FrontendExplorerPage {
  readonly data = inject(PortalDataService);
  readonly cols = ['component', 'method', 'url'];
  readonly svcCols = ['name', 'file'];

  httpRows(): Record<string, string>[] {
    return (this.data.httpCalls() as Record<string, string>[]).slice(0, 200);
  }

  serviceRows(): Record<string, string>[] {
    return (this.data.feServices() as Record<string, string>[]).slice(0, 200);
  }
}
