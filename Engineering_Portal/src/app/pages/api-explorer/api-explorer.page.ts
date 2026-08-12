import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PortalDataService } from '../../core/services/portal-data.service';

@Component({
  selector: 'ep-api-explorer-page',
  standalone: true,
  imports: [PageHeaderComponent, FormsModule, MatFormFieldModule, MatInputModule, MatTableModule, MatChipsModule],
  template: `
    <div class="ep-page">
      <ep-page-header title="API Explorer" [subtitle]="data.endpoints().length + ' Express endpoints'" />
      <mat-form-field appearance="outline" class="filter">
        <mat-label>Search endpoints</mat-label>
        <input matInput [(ngModel)]="query" (ngModelChange)="querySig.set($event)" />
      </mat-form-field>
      <table mat-table [dataSource]="rows()" class="tbl">
        <ng-container matColumnDef="method">
          <th mat-header-cell *matHeaderCellDef>Method</th>
          <td mat-cell *matCellDef="let row"><span class="ep-tag">{{ row.method }}</span></td>
        </ng-container>
        <ng-container matColumnDef="path">
          <th mat-header-cell *matHeaderCellDef>Path</th>
          <td mat-cell *matCellDef="let row">{{ row.fullPath }}</td>
        </ng-container>
        <ng-container matColumnDef="module">
          <th mat-header-cell *matHeaderCellDef>Module</th>
          <td mat-cell *matCellDef="let row">{{ row.module }}</td>
        </ng-container>
        <ng-container matColumnDef="permissions">
          <th mat-header-cell *matHeaderCellDef>Permissions</th>
          <td mat-cell *matCellDef="let row">{{ row.permissions?.join(', ') || '—' }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="cols"></tr>
        <tr mat-row *matRowDef="let row; columns: cols"></tr>
      </table>
    </div>
  `,
  styles: `.filter { width: 100%; max-width: 420px; margin-bottom: 1rem; } .tbl { width: 100%; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiExplorerPage {
  readonly data = inject(PortalDataService);
  readonly querySig = signal('');
  query = '';
  readonly cols = ['method', 'path', 'module', 'permissions'];
  readonly rows = computed(() => {
    const q = this.querySig().toLowerCase();
    return this.data.endpoints().filter(
      (e) => !q || e.fullPath.toLowerCase().includes(q) || e.method.toLowerCase().includes(q) || e.module.toLowerCase().includes(q),
    );
  });
}
