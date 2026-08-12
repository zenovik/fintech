import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PortalDataService } from '../../core/services/portal-data.service';

@Component({
  selector: 'ep-database-explorer-page',
  standalone: true,
  imports: [PageHeaderComponent, FormsModule, MatFormFieldModule, MatInputModule, MatTableModule],
  template: `
    <div class="ep-page">
      <ep-page-header title="Database Explorer" [subtitle]="data.tables().length + ' tables mapped from SQL analysis'" />
      <mat-form-field appearance="outline" class="filter">
        <mat-label>Search tables</mat-label>
        <input matInput [(ngModel)]="query" (ngModelChange)="querySig.set($event)" />
      </mat-form-field>
      <table mat-table [dataSource]="rows()" class="tbl">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Table</th>
          <td mat-cell *matCellDef="let row">{{ row.name }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="['name']"></tr>
        <tr mat-row *matRowDef="let row; columns: ['name']"></tr>
      </table>
    </div>
  `,
  styles: `.filter { width: 100%; max-width: 420px; } .tbl { width: 100%; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatabaseExplorerPage {
  readonly data = inject(PortalDataService);
  readonly querySig = signal('');
  query = '';
  readonly rows = computed(() => {
    const q = this.querySig().toLowerCase();
    return this.data.tables().filter((t) => !q || t.toLowerCase().includes(q)).map((name) => ({ name }));
  });
}
