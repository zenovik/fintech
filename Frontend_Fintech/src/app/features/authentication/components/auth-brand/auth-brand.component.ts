import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-brand',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth-brand.component.html',
  styleUrl: './auth-brand.component.scss',
})
export class AuthBrandComponent {
  @Input() icon = 'payments';
  @Input() title = 'Merchant Pro';
  @Input() subtitle = 'Enterprise Merchant Portal';
  @Input() filledIcon = true;
}
