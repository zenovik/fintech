import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ep-page-header',
  standalone: true,
  template: `
    <header class="page-header">
      <div>
        <h1>{{ title() }}</h1>
        @if (subtitle()) {
          <p class="ep-muted">{{ subtitle() }}</p>
        }
      </div>
      <ng-content />
    </header>
  `,
  styles: `
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    h1 {
      margin: 0 0 0.25rem;
      font-size: 1.75rem;
      font-weight: 600;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
