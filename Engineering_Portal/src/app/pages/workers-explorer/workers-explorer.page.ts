import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PortalDataService } from '../../core/services/portal-data.service';

@Component({
  selector: 'ep-workers-explorer-page',
  standalone: true,
  imports: [PageHeaderComponent, MatTableModule],
  template: `
    <div class="ep-page">
      <ep-page-header title="Workers Explorer" subtitle="Background jobs, queues, retries, and Redis" />
      <table mat-table [dataSource]="rows()" class="tbl">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Worker</th>
          <td mat-cell *matCellDef="let row">{{ row.name }}</td>
        </ng-container>
        <ng-container matColumnDef="queue">
          <th mat-header-cell *matHeaderCellDef>Queue</th>
          <td mat-cell *matCellDef="let row">{{ row.queue }}</td>
        </ng-container>
        <ng-container matColumnDef="file">
          <th mat-header-cell *matHeaderCellDef>File</th>
          <td mat-cell *matCellDef="let row">{{ row.file }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols"></tr>
      </table>
    </div>
  `,
  styles: `.tbl { width: 100%; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkersExplorerPage {
  readonly data = inject(PortalDataService);
  readonly cols = ['name', 'queue', 'file'];

  rows(): Record<string, string>[] {
    return (this.data.workers() as Record<string, unknown>[]).map((w) => ({
      name: String(w['name'] ?? w['worker'] ?? 'Worker'),
      queue: String(w['queue'] ?? w['redisKey'] ?? '—'),
      file: String(w['file'] ?? w['path'] ?? '—'),
    }));
  }
}
