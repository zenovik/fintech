import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="loading-state" role="status" [attr.aria-label]="ariaLabel" [attr.aria-busy]="true">
      <mat-spinner diameter="40" aria-hidden="true"></mat-spinner>
      @if (message) {
        <p class="loading-message">{{ message }}</p>
      }
    </div>
  `,
  styles: [`
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 32px 16px;
      min-height: 120px;
    }
    .loading-message { margin: 0; color: var(--dash-muted, #64748b); font-size: 0.875rem; }
  `],
})
export class LoadingStateComponent {
  @Input() message = 'Loading…';
  @Input() ariaLabel = 'Loading content';
}
