import { Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <fieldset class="co-fieldset">
      <legend>Billing address</legend>
      <label>Line 1 <input type="text" [(ngModel)]="line1" name="line1" autocomplete="address-line1" /></label>
      <label>City <input type="text" [(ngModel)]="city" name="city" autocomplete="address-level2" /></label>
      <div class="co-fieldset__row">
        <label>State <input type="text" [(ngModel)]="state" name="state" autocomplete="address-level1" /></label>
        <label>PIN <input type="text" [(ngModel)]="pin" name="pin" autocomplete="postal-code" /></label>
      </div>
      <label>Country <input type="text" [(ngModel)]="country" name="country" autocomplete="country-name" /></label>
    </fieldset>
  `,
  styles: [`
    .co-fieldset { border: none; padding: 0; margin: 0 0 20px; }
    legend { font-size: 14px; font-weight: 600; margin-bottom: 12px; color: #0f172a; }
    label { display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 12px; }
    input {
      display: block; width: 100%; margin-top: 6px; padding: 12px;
      border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; box-sizing: border-box;
    }
    .co-fieldset__row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  `],
})
export class AddressFormComponent {
  readonly line1 = model('');
  readonly city = model('');
  readonly state = model('');
  readonly pin = model('');
  readonly country = model('');
}
