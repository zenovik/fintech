import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'ep-stat-card',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <mat-card class="ep-card stat-card">
      <mat-card-header>
        <mat-card-title>{{ title() }}</mat-card-title>
        @if (subtitle()) {
          <mat-card-subtitle>{{ subtitle() }}</mat-card-subtitle>
        }
      </mat-card-header>
      <mat-card-content>
        <div class="value">{{ value() }}</div>
        @if (hint()) {
          <div class="ep-muted">{{ hint() }}</div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .stat-card .value {
      font-size: 2rem;
      font-weight: 700;
      line-height: 1.2;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCardComponent {
  readonly title = input.required<string>();
  readonly value = input.required<string | number>();
  readonly subtitle = input<string>();
  readonly hint = input<string>();
}
