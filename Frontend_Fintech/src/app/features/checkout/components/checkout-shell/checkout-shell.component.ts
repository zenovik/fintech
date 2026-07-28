import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CheckoutBranding } from '../../models/checkout.models';

@Component({
  selector: 'app-checkout-shell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="co-shell" [class.co-shell--embed]="embed()" [class.co-shell--dark]="dark()">
      @if (branding()?.brandBannerUrl) {
        <img class="co-shell__banner" [src]="branding()!.brandBannerUrl!" [alt]="branding()?.merchantName ?? 'Merchant'" />
      }
      <header class="co-shell__header">
        @if (branding()?.logoUrl) {
          <img class="co-shell__logo" [src]="branding()!.logoUrl!" [alt]="branding()?.merchantName ?? 'Logo'" />
        } @else {
          <h1 class="co-shell__title">{{ branding()?.merchantName ?? merchantName() }}</h1>
        }
      </header>
      <main class="co-shell__main">
        <ng-content />
      </main>
      <footer class="co-shell__footer">
        @if (branding()?.supportEmail) {
          <a [href]="'mailto:' + branding()!.supportEmail">Support</a>
        }
        @if (branding()?.termsUrl) { <a [href]="branding()!.termsUrl!" target="_blank" rel="noopener">Terms</a> }
        @if (branding()?.privacyUrl) { <a [href]="branding()!.privacyUrl!" target="_blank" rel="noopener">Privacy</a> }
        <span>Secured checkout</span>
      </footer>
    </div>
  `,
  styles: [`
    .co-shell {
      min-height: 100vh; display: flex; flex-direction: column;
      font-family: var(--co-font, Inter, sans-serif);
      background: #f1f5f9; color: #0f172a;
    }
    .co-shell--embed { min-height: auto; }
    .co-shell--dark { background: #0f172a; color: #f8fafc; }
    .co-shell__banner { width: 100%; max-height: 120px; object-fit: cover; }
    .co-shell__header {
      padding: 20px 24px; background: #fff; border-bottom: 1px solid #e2e8f0;
      display: flex; align-items: center; justify-content: center;
    }
    .co-shell--dark .co-shell__header { background: #1e293b; border-color: #334155; }
    .co-shell__logo { max-height: 40px; max-width: 180px; object-fit: contain; }
    .co-shell__title { margin: 0; font-size: 20px; font-weight: 700; color: var(--co-primary, #003d9b); }
    .co-shell__main { flex: 1; padding: 24px 16px; max-width: 960px; width: 100%; margin: 0 auto; box-sizing: border-box; }
    .co-shell__footer {
      padding: 16px 24px; display: flex; flex-wrap: wrap; gap: 16px; justify-content: center;
      font-size: 12px; color: #64748b; background: #fff; border-top: 1px solid #e2e8f0;
    }
    .co-shell__footer a { color: var(--co-accent, #4f46e5); text-decoration: none; }
  `],
})
export class CheckoutShellComponent {
  readonly branding = input<CheckoutBranding | null>(null);
  readonly merchantName = input('');
  readonly embed = input(false);
  readonly dark = input(false);
}
