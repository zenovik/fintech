import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'ep-data-table',
  standalone: true,
  imports: [MatTableModule],
  template: `
    <table mat-table [dataSource]="rows()" class="data-table">
      @for (col of columns(); track col.key) {
        <ng-container [matColumnDef]="col.key">
          <th mat-header-cell *matHeaderCellDef>{{ col.label }}</th>
          <td mat-cell *matCellDef="let row">{{ row[col.key] }}</td>
        </ng-container>
      }
      <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns()"></tr>
    </table>
  `,
  styles: `
    .data-table {
      width: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent {
  readonly columns = input<{ key: string; label: string }[]>([]);
  readonly rows = input<Record<string, unknown>[]>([]);

  displayedColumns(): string[] {
    return this.columns().map((c) => c.key);
  }
}
