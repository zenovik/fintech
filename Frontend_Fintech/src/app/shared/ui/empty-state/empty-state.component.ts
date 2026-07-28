import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state" role="status">
      @if (icon) {
        <span class="empty-icon" aria-hidden="true">{{ icon }}</span>
      }
      <h3>{{ title }}</h3>
      @if (description) {
        <p>{{ description }}</p>
      }
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--dash-muted, #64748b);
    }
    .empty-icon { font-size: 2rem; display: block; margin-bottom: 8px; }
    h3 { margin: 0 0 8px; color: var(--dash-text, #0f172a); font-size: 1.1rem; }
    p { margin: 0; max-width: 420px; margin-inline: auto; }
  `],
})
export class EmptyStateComponent {
  @Input() title = 'No data yet';
  @Input() description = '';
  @Input() icon = '';
}
