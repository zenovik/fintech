import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CheckoutApiService } from '../../../checkout/services/checkout-api.service';
import { CheckoutTheme } from '../../../checkout/models/checkout.models';

@Component({
  selector: 'app-checkout-theme-list',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './checkout-theme-list.component.html',
  styleUrl: './checkout-theme-list.component.scss',
})
export class CheckoutThemeListComponent implements OnInit {
  private readonly api = inject(CheckoutApiService);

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly themes = signal<CheckoutTheme[]>([]);

  ngOnInit(): void {
    this.api.listThemes().subscribe({
      next: (t) => { this.themes.set(t); this.pageState.set('ready'); },
      error: () => this.pageState.set('error'),
    });
  }
}
