import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-icon-button',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <button
      mat-icon-button
      type="button"
      [disabled]="disabled"
      [attr.aria-label]="ariaLabel"
      [attr.title]="title || ariaLabel"
    >
      <mat-icon aria-hidden="true">{{ icon }}</mat-icon>
    </button>
  `,
})
export class IconButtonComponent {
  @Input({ required: true }) icon!: string;
  @Input({ required: true }) ariaLabel!: string;
  @Input() title = '';
  @Input() disabled = false;
}
