import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'ep-score-chart',
  standalone: true,
  imports: [MatProgressBarModule],
  template: `
    <div class="score-chart">
      @for (item of items(); track item.label) {
        <div class="row">
          <div class="label-row">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}%</strong>
          </div>
          <mat-progress-bar mode="determinate" [value]="item.value" />
        </div>
      }
    </div>
  `,
  styles: `
    .score-chart {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .label-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      margin-bottom: 0.25rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScoreChartComponent {
  readonly items = input<{ label: string; value: number }[]>([]);
}
