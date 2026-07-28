import { Component, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-order-summary',
  standalone: true,
  imports: [CurrencyPipe],
  template: `
    <aside class="co-summary" aria-label="Order summary">
      <h2>Order Summary</h2>
      <div class="co-summary__row">
        <span>Merchant</span>
        <strong>{{ merchantName() }}</strong>
      </div>
      <div class="co-summary__row">
        <span>Reference</span>
        <strong>{{ intentRef() }}</strong>
      </div>
      <div class="co-summary__total">
        <span>Total</span>
        <strong>{{ amount() | currency:currency():'symbol':'1.2-2' }}</strong>
      </div>
    </aside>
  `,
  styles: [`
    .co-summary {
      padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;
    }
    h2 { margin: 0 0 16px; font-size: 16px; font-weight: 600; }
    .co-summary__row {
      display: flex; justify-content: space-between; gap: 12px;
      font-size: 13px; margin-bottom: 10px; color: #64748b;
    }
    .co-summary__row strong { color: #0f172a; text-align: right; }
    .co-summary__total {
      display: flex; justify-content: space-between; align-items: center;
      margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;
      font-size: 15px;
    }
    .co-summary__total strong { font-size: 22px; color: var(--co-primary, #003d9b); }
  `],
})
export class OrderSummaryComponent {
  readonly merchantName = input('');
  readonly intentRef = input('');
  readonly amount = input(0);
  readonly currency = input('USD');
}
