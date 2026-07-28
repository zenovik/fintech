import { Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-checkout-loading-overlay',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    @if (visible()) {
      <div class="co-overlay" role="status" aria-live="polite">
        <mat-spinner diameter="44" />
        <p>{{ message() }}</p>
      </div>
    }
  `,
  styles: [`
    .co-overlay {
      position: fixed; inset: 0; z-index: 1000;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: rgba(15, 23, 42, 0.45); color: #fff; gap: 16px;
    }
    p { margin: 0; font-size: 14px; font-weight: 500; }
  `],
})
export class CheckoutLoadingOverlayComponent {
  readonly visible = input(false);
  readonly message = input('Processing payment…');
}
