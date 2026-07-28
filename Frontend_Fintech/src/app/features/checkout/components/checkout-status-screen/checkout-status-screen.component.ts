import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CheckoutStatusType = 'success' | 'failure' | 'pending' | 'expired' | 'cancelled' | 'error';

@Component({
  selector: 'app-checkout-status-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="co-status co-status--{{ type() }}" role="status">
      <span class="material-symbols-outlined co-status__icon">{{ icon() }}</span>
      <h1>{{ title() }}</h1>
      @if (message()) { <p>{{ message() }}</p> }
      @if (showRetry()) {
        <button type="button" class="co-status__btn co-status__btn--primary" (click)="retry.emit()">Try again</button>
      }
      @if (showClose()) {
        <button type="button" class="co-status__btn" (click)="close.emit()">Close</button>
      }
    </div>
  `,
  styles: [`
    .co-status { text-align: center; padding: 40px 24px; }
    .co-status__icon { font-size: 56px; display: block; margin-bottom: 16px; }
    h1 { margin: 0 0 8px; font-size: 24px; }
    p { margin: 0 0 24px; color: #64748b; font-size: 15px; }
    .co-status--success .co-status__icon { color: #027a48; }
    .co-status--failure .co-status__icon, .co-status--error .co-status__icon { color: #b42318; }
    .co-status--pending .co-status__icon { color: #b54708; }
    .co-status--expired .co-status__icon, .co-status--cancelled .co-status__icon { color: #64748b; }
    .co-status__btn {
      padding: 12px 24px; border-radius: 8px; border: 1px solid #e2e8f0;
      background: #fff; cursor: pointer; font-weight: 600; margin: 0 6px;
    }
    .co-status__btn--primary {
      background: var(--co-accent, #4f46e5); color: #fff; border-color: transparent;
    }
  `],
})
export class CheckoutStatusScreenComponent {
  readonly type = input<CheckoutStatusType>('success');
  readonly title = input('Payment successful');
  readonly message = input('');
  readonly showRetry = input(false);
  readonly showClose = input(false);

  readonly retry = output<void>();
  readonly close = output<void>();

  icon(): string {
    const map: Record<CheckoutStatusType, string> = {
      success: 'check_circle',
      failure: 'cancel',
      pending: 'hourglass_top',
      expired: 'timer_off',
      cancelled: 'block',
      error: 'error',
    };
    return map[this.type()];
  }
}
