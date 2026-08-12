import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { GraphViewerComponent } from '../../shared/components/graph-viewer/graph-viewer.component';
import { PortalDataService } from '../../core/services/portal-data.service';

@Component({
  selector: 'ep-backend-explorer-page',
  standalone: true,
  imports: [PageHeaderComponent, MatTabsModule, MatTableModule, GraphViewerComponent],
  template: `
    <div class="ep-page">
      <ep-page-header title="Backend Explorer" subtitle="Controllers, services, repositories, SQL, workers" />
      <mat-tab-group>
        <mat-tab label="Call Graph">
          <ep-graph-viewer [nodes]="data.beCallgraph()?.nodes ?? []" [edges]="data.beCallgraph()?.edges ?? []" />
        </mat-tab>
        <mat-tab label="Controller → Service">
          <table mat-table [dataSource]="ctrlRows()" class="tbl">
            <ng-container matColumnDef="controller">
              <th mat-header-cell *matHeaderCellDef>Controller</th>
              <td mat-cell *matCellDef="let row">{{ row.controller }}</td>
            </ng-container>
            <ng-container matColumnDef="service">
              <th mat-header-cell *matHeaderCellDef>Service</th>
              <td mat-cell *matCellDef="let row">{{ row.service }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="ctrlCols"></tr>
            <tr mat-row *matRowDef="let row; columns: ctrlCols"></tr>
          </table>
        </mat-tab>
        <mat-tab label="SQL Mappings">
          <table mat-table [dataSource]="sqlRows()" class="tbl">
            <ng-container matColumnDef="repository">
              <th mat-header-cell *matHeaderCellDef>Repository</th>
              <td mat-cell *matCellDef="let row">{{ row.repository }}</td>
            </ng-container>
            <ng-container matColumnDef="tables">
              <th mat-header-cell *matHeaderCellDef>Tables</th>
              <td mat-cell *matCellDef="let row">{{ row.tables }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="sqlCols"></tr>
            <tr mat-row *matRowDef="let row; columns: sqlCols"></tr>
          </table>
        </mat-tab>
        <mat-tab label="Middleware">
          <table mat-table [dataSource]="mwRows()" class="tbl">
            <ng-container matColumnDef="route">
              <th mat-header-cell *matHeaderCellDef>Route</th>
              <td mat-cell *matCellDef="let row">{{ row.route }}</td>
            </ng-container>
            <ng-container matColumnDef="middleware">
              <th mat-header-cell *matHeaderCellDef>Chain</th>
              <td mat-cell *matCellDef="let row">{{ row.middleware }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="mwCols"></tr>
            <tr mat-row *matRowDef="let row; columns: mwCols"></tr>
          </table>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: `.tbl { width: 100%; margin-top: 1rem; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackendExplorerPage {
  readonly data = inject(PortalDataService);
  readonly ctrlCols = ['controller', 'service'];
  readonly sqlCols = ['repository', 'tables'];
  readonly mwCols = ['route', 'middleware'];

  ctrlRows(): Record<string, string>[] {
    return (this.data.beControllers() as Record<string, string>[]).slice(0, 200);
  }

  sqlRows(): Record<string, string>[] {
    return (this.data.beSql() as Record<string, unknown>[]).slice(0, 200).map((r) => ({
      repository: String(r['repository'] ?? r['file'] ?? ''),
      tables: Array.isArray(r['tables']) ? (r['tables'] as string[]).join(', ') : String(r['table'] ?? ''),
    }));
  }

  mwRows(): Record<string, string>[] {
    return (this.data.middleware() as Record<string, unknown>[]).slice(0, 200).map((r) => ({
      route: String(r['route'] ?? r['path'] ?? ''),
      middleware: Array.isArray(r['middleware']) ? (r['middleware'] as string[]).join(' → ') : String(r['name'] ?? ''),
    }));
  }
}
