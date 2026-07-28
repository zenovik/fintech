import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <fieldset class="co-fieldset">
      <legend>Contact details</legend>
      <label>
        Email
        <input type="email" [(ngModel)]="email" name="email" autocomplete="email" required />
      </label>
      <label>
        Phone
        <input type="tel" [(ngModel)]="phone" name="phone" autocomplete="tel" />
      </label>
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
    input:focus { outline: 2px solid var(--co-accent, #4f46e5); border-color: transparent; }
  `],
})
export class CustomerFormComponent {
  readonly email = model('');
  readonly phone = model('');
  readonly locale = input('en-US');
}
