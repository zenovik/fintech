import { Component, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PAYMENT_METHOD_ICONS, PAYMENT_METHOD_LABELS } from '../../constants/checkout.constants';

@Component({
  selector: 'app-payment-method-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="co-methods" role="radiogroup" aria-label="Payment method">
      @for (method of methods(); track method) {
        <button type="button" class="co-methods__item"
          [class.co-methods__item--active]="selected() === method"
          [attr.aria-checked]="selected() === method"
          role="radio"
          (click)="selected.set(method)">
          <span class="material-symbols-outlined">{{ icon(method) }}</span>
          <span>{{ label(method) }}</span>
        </button>
      }
    </div>
  `,
  styles: [`
    .co-methods { display: grid; gap: 10px; }
    .co-methods__item {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 16px; border: 2px solid #e2e8f0; border-radius: 12px;
      background: #fff; cursor: pointer; font-size: 14px; font-weight: 500;
      text-align: left; transition: border-color .15s, background .15s;
    }
    .co-methods__item:hover { border-color: #94a3b8; }
    .co-methods__item--active { border-color: var(--co-accent, #4f46e5); background: #eef2ff; }
    .material-symbols-outlined { font-size: 22px; color: var(--co-accent, #4f46e5); }
  `],
})
export class PaymentMethodSelectorComponent {
  readonly methods = input<string[]>([]);
  readonly selected = model<string>('');

  label(code: string): string {
    return PAYMENT_METHOD_LABELS[code] ?? code.replace(/_/g, ' ');
  }

  icon(code: string): string {
    return PAYMENT_METHOD_ICONS[code] ?? 'payments';
  }
}
