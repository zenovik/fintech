import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CheckoutApiService } from '../../services/checkout-api.service';
import { PublicCheckout } from '../../models/checkout.models';
import { CheckoutShellComponent } from '../../components/checkout-shell/checkout-shell.component';
import { OrderSummaryComponent } from '../../components/order-summary/order-summary.component';
import { PaymentMethodSelectorComponent } from '../../components/payment-method-selector/payment-method-selector.component';
import { CustomerFormComponent } from '../../components/customer-form/customer-form.component';
import { AddressFormComponent } from '../../components/address-form/address-form.component';
import { CheckoutCountdownComponent } from '../../components/checkout-countdown/checkout-countdown.component';
import { CheckoutStatusScreenComponent } from '../../components/checkout-status-screen/checkout-status-screen.component';
import { CheckoutLoadingOverlayComponent } from '../../components/checkout-loading-overlay/checkout-loading-overlay.component';

type PageState = 'loading' | 'checkout' | 'success' | 'failure' | 'pending' | 'expired' | 'cancelled' | 'error';

@Component({
  selector: 'app-hosted-checkout',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatProgressSpinnerModule, CurrencyPipe,
    CheckoutShellComponent, OrderSummaryComponent, PaymentMethodSelectorComponent,
    CustomerFormComponent, AddressFormComponent, CheckoutCountdownComponent,
    CheckoutStatusScreenComponent, CheckoutLoadingOverlayComponent,
  ],
  templateUrl: './hosted-checkout.component.html',
  styleUrl: './hosted-checkout.component.scss',
})
export class HostedCheckoutComponent implements OnInit {
  private readonly api = inject(CheckoutApiService);
  private readonly route = inject(ActivatedRoute);

  readonly pageState = signal<PageState>('loading');
  readonly checkout = signal<PublicCheckout | null>(null);
  readonly paying = signal(false);
  readonly errorMsg = signal('');
  readonly successRef = signal('');
  readonly isRetry = signal(false);

  checkoutRef = '';
  clientSecret = '';
  embedMode = false;
  popupMode = false;

  selectedMethod = '';
  customerEmail = '';
  customerPhone = '';
  addressLine1 = '';
  addressCity = '';
  addressState = '';
  addressPin = '';
  addressCountry = '';

  readonly brandingVars = computed(() => {
    const b = this.checkout()?.branding;
    if (!b) return {};
    return {
      '--co-primary': b.primaryColor,
      '--co-accent': b.accentColor,
      '--co-font': b.fontFamily,
    } as Record<string, string>;
  });

  ngOnInit(): void {
    this.checkoutRef = this.route.snapshot.paramMap.get('ref') ?? '';
    const storageKey = this.secretStorageKey(this.checkoutRef);
    this.clientSecret =
      sessionStorage.getItem(storageKey)
      ?? this.route.snapshot.queryParamMap.get('client_secret')
      ?? '';
    const mode = this.route.snapshot.queryParamMap.get('mode') ?? '';
    this.embedMode = mode === 'embed' || this.route.snapshot.queryParamMap.get('embed') === '1';
    this.popupMode = mode === 'popup';

    const recover = this.route.snapshot.queryParamMap.get('recover');
    if (recover) {
      this.api.recover(recover).subscribe({
        next: (r) => {
          this.checkoutRef = r.checkoutRef;
          this.clientSecret = r.clientSecret;
          sessionStorage.setItem(this.secretStorageKey(this.checkoutRef), this.clientSecret);
          this.loadCheckout();
        },
        error: () => this.setError('Recovery link is invalid or expired.'),
      });
      return;
    }

    if (!this.checkoutRef || !this.clientSecret) {
      this.setError('Invalid checkout link. Open the checkout from your payment session or use a recovery link.');
      return;
    }
    sessionStorage.setItem(storageKey, this.clientSecret);
    this.loadCheckout();
  }

  private secretStorageKey(ref: string): string {
    return `checkout_cs_${ref}`;
  }

  loadCheckout(): void {
    this.pageState.set('loading');
    this.api.getPublicCheckout(this.checkoutRef, this.clientSecret).subscribe({
      next: (data) => {
        this.checkout.set(data);
        if (data.paymentMethods.length) this.selectedMethod = data.paymentMethods[0];
        if (data.status === 'complete') this.pageState.set('success');
        else if (data.status === 'expired') this.pageState.set('expired');
        else if (data.status === 'cancelled') this.pageState.set('cancelled');
        else if (data.status === 'pending') this.pageState.set('pending');
        else if (data.status === 'abandoned') this.pageState.set('failure');
        else this.pageState.set('checkout');
        this.applyBranding(data);
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Checkout session unavailable.';
        if (msg.toLowerCase().includes('expired')) this.pageState.set('expired');
        else this.setError(msg);
      },
    });
  }

  pay(): void {
    const c = this.checkout();
    if (!c || !this.selectedMethod) {
      this.errorMsg.set('Please select a payment method.');
      return;
    }
    this.paying.set(true);
    this.errorMsg.set('');
    const payload = {
      paymentMethodCode: this.selectedMethod,
      customerEmail: this.customerEmail.trim() || undefined,
      customerPhone: this.customerPhone.trim() || undefined,
      billingAddress: {
        line1: this.addressLine1, city: this.addressCity,
        state: this.addressState, pin: this.addressPin, country: this.addressCountry,
      },
    };
    const req = this.isRetry()
      ? this.api.retry(this.checkoutRef, this.clientSecret, payload)
      : this.api.pay(this.checkoutRef, this.clientSecret, payload);

    req.subscribe({
      next: (result) => this.handleSuccess(result.intent.intentRef, result.redirectUrl),
      error: (err) => {
        this.paying.set(false);
        const canRetry = err?.error?.canRetry ?? false;
        this.errorMsg.set(err?.error?.message ?? 'Payment failed.');
        if (canRetry) {
          this.isRetry.set(true);
          this.pageState.set('failure');
        } else {
          this.pageState.set('failure');
        }
        this.postMessage('checkout.failure', { reason: this.errorMsg() });
        const url = err?.error?.redirectUrl;
        if (url) setTimeout(() => { window.location.href = url; }, 2500);
      },
    });
  }

  cancelCheckout(): void {
    this.paying.set(true);
    this.api.cancel(this.checkoutRef, this.clientSecret).subscribe({
      next: (r) => {
        this.paying.set(false);
        this.pageState.set('cancelled');
        this.postMessage('checkout.cancelled', {});
        if (r.redirectUrl) setTimeout(() => { window.location.href = r.redirectUrl!; }, 1500);
      },
      error: () => { this.paying.set(false); this.pageState.set('cancelled'); },
    });
  }

  onExpired(): void {
    this.pageState.set('expired');
    this.postMessage('checkout.expired', {});
  }

  retryPayment(): void {
    this.isRetry.set(true);
    this.pageState.set('checkout');
    this.errorMsg.set('');
  }

  closePopup(): void {
    this.postMessage('checkout.close', {});
    window.close();
  }

  private handleSuccess(ref: string, redirectUrl?: string | null): void {
    this.paying.set(false);
    this.successRef.set(ref);
    this.pageState.set('success');
    this.postMessage('checkout.success', { intentRef: ref });
    const url = redirectUrl ?? this.checkout()?.redirectUrls.success;
    if (url) setTimeout(() => { window.location.href = url; }, 2000);
  }

  private setError(msg: string): void {
    this.errorMsg.set(msg);
    this.pageState.set('error');
  }

  private applyBranding(c: PublicCheckout): void {
    const b = c.branding;
    document.documentElement.style.setProperty('--co-primary', b.primaryColor);
    document.documentElement.style.setProperty('--co-accent', b.accentColor);
    document.documentElement.style.setProperty('--co-font', b.fontFamily);
    if (b.faviconUrl) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
      link.href = b.faviconUrl;
    }
  }

  private postMessage(type: string, payload: Record<string, unknown>): void {
    if (!this.embedMode && !this.popupMode) return;
    window.parent?.postMessage({ source: 'merchantpro-checkout', type, payload }, '*');
    if (this.popupMode) window.opener?.postMessage({ source: 'merchantpro-checkout', type, payload }, '*');
  }
}
