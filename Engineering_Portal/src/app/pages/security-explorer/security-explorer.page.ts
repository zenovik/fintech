import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ScoreChartComponent } from '../../shared/components/score-chart/score-chart.component';
import { PortalDataService } from '../../core/services/portal-data.service';

@Component({
  selector: 'ep-security-explorer-page',
  standalone: true,
  imports: [PageHeaderComponent, FormsModule, MatFormFieldModule, MatInputModule, MatTableModule, ScoreChartComponent],
  template: `
    <div class="ep-page">
      <ep-page-header title="Security Explorer" subtitle="Permissions, JWT, CSRF, rate limits, OWASP" />
      <ep-score-chart [items]="scores()" />
      <mat-form-field appearance="outline" class="filter">
        <mat-label>Search permissions</mat-label>
        <input matInput [(ngModel)]="query" (ngModelChange)="querySig.set($event)" />
      </mat-form-field>
      <table mat-table [dataSource]="rows()" class="tbl">
        <ng-container matColumnDef="permission">
          <th mat-header-cell *matHeaderCellDef>Permission</th>
          <td mat-cell *matCellDef="let row">{{ row.permission }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="['permission']"></tr>
        <tr mat-row *matRowDef="let row; columns: ['permission']"></tr>
      </table>
    </div>
  `,
  styles: `.filter { width: 100%; max-width: 420px; margin: 1rem 0; } .tbl { width: 100%; }`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecurityExplorerPage {
  readonly data = inject(PortalDataService);
  readonly querySig = signal('');
  query = '';
  readonly scores = computed(() => [{ label: 'Security Score', value: this.data.metrics().securityScore }]);
  readonly rows = computed(() => {
    const q = this.querySig().toLowerCase();
    return this.data.permissions().filter((p) => !q || p.toLowerCase().includes(q)).map((permission) => ({ permission }));
  });
}
