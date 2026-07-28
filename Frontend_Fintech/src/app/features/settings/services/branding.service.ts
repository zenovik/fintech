import { Injectable, inject, signal } from '@angular/core';
import { SettingsApiService } from './settings-api.service';
import { BrandingSettings } from '../models/settings.models';

const DEFAULT_BRANDING: BrandingSettings = {
  companyName: 'Merchant Pro',
  logoUrl: null,
  logoInitials: 'MP',
  primaryColor: '#003ec7',
  secondaryColor: '#1e40af',
  accentColor: '#22c55e',
  faviconUrl: null,
};

@Injectable({ providedIn: 'root' })
export class BrandingService {
  private readonly api = inject(SettingsApiService);
  readonly branding = signal<BrandingSettings>(DEFAULT_BRANDING);
  private loaded = false;

  load(): void {
    if (this.loaded) return;
    this.api.getPublicBranding().subscribe({
      next: (data) => { this.branding.set(data); this.loaded = true; },
      error: () => this.branding.set(DEFAULT_BRANDING),
    });
  }

  refresh(): void {
    this.loaded = false;
    this.load();
  }
}
