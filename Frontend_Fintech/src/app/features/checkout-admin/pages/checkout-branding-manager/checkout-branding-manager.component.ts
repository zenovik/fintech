import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CheckoutApiService } from '../../../checkout/services/checkout-api.service';
import { CheckoutBranding, CheckoutTheme } from '../../../checkout/models/checkout.models';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';

@Component({
  selector: 'app-checkout-branding-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule],
  templateUrl: './checkout-branding-manager.component.html',
  styleUrl: './checkout-branding-manager.component.scss',
})
export class CheckoutBrandingManagerComponent implements OnInit {
  private readonly api = inject(CheckoutApiService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  readonly pageState = signal<'idle' | 'loading' | 'ready' | 'saving' | 'error'>('idle');
  readonly themes = signal<CheckoutTheme[]>([]);

  merchantId = '';
  form = {
    themeId: 1,
    logoUrl: '',
    primaryColor: '#003d9b',
    secondaryColor: '#64748b',
    accentColor: '#4f46e5',
    fontFamily: 'Inter, sans-serif',
    supportEmail: '',
    supportPhone: '',
    termsUrl: '',
    privacyUrl: '',
    merchantName: '',
    merchantAddress: '',
    brandBannerUrl: '',
    darkModeDefault: false,
  };

  ngOnInit(): void {
    this.api.listThemes().subscribe({ next: (t) => this.themes.set(t) });
  }

  load(): void {
    if (!this.merchantId) return;
    this.pageState.set('loading');
    this.api.getBranding(Number(this.merchantId)).subscribe({
      next: ({ branding }) => {
        this.applyBranding(branding);
        this.pageState.set('ready');
      },
      error: () => this.pageState.set('error'),
    });
  }

  save(): void {
    if (!this.merchantId || !this.rbac.hasPermission(PERMISSIONS.CHECKOUT_BRANDING)) return;
    this.pageState.set('saving');
    this.api.updateBranding(Number(this.merchantId), {
      themeId: this.form.themeId,
      logoUrl: this.form.logoUrl || undefined,
      primaryColor: this.form.primaryColor,
      secondaryColor: this.form.secondaryColor,
      accentColor: this.form.accentColor,
      fontFamily: this.form.fontFamily,
      supportEmail: this.form.supportEmail || undefined,
      supportPhone: this.form.supportPhone || undefined,
      termsUrl: this.form.termsUrl || undefined,
      privacyUrl: this.form.privacyUrl || undefined,
      merchantName: this.form.merchantName || undefined,
      merchantAddress: this.form.merchantAddress || undefined,
      brandBannerUrl: this.form.brandBannerUrl || undefined,
      darkModeDefault: this.form.darkModeDefault,
    }).subscribe({
      next: ({ branding }) => { this.applyBranding(branding); this.pageState.set('ready'); },
      error: () => this.pageState.set('error'),
    });
  }

  private applyBranding(b: CheckoutBranding & { themeId?: number }): void {
    this.form.primaryColor = b.primaryColor;
    this.form.secondaryColor = b.secondaryColor;
    this.form.accentColor = b.accentColor;
    this.form.fontFamily = b.fontFamily;
    this.form.logoUrl = b.logoUrl ?? '';
    this.form.supportEmail = b.supportEmail ?? '';
    this.form.supportPhone = b.supportPhone ?? '';
    this.form.termsUrl = b.termsUrl ?? '';
    this.form.privacyUrl = b.privacyUrl ?? '';
    this.form.merchantName = b.merchantName ?? '';
    this.form.merchantAddress = b.merchantAddress ?? '';
    this.form.brandBannerUrl = b.brandBannerUrl ?? '';
    this.form.darkModeDefault = Boolean(b.darkModeDefault);
  }
}
