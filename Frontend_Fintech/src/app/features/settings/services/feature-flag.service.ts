import { Injectable, inject, signal } from '@angular/core';
import { SettingsApiService } from './settings-api.service';

@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private readonly api = inject(SettingsApiService);
  readonly enabledFlags = signal<Set<string>>(new Set());
  private loaded = false;

  load(): void {
    if (this.loaded) return;
    this.api.getPublicFeatureFlags().subscribe({
      next: (flags) => {
        this.enabledFlags.set(new Set(flags.map((f) => f.code)));
        this.loaded = true;
      },
      error: () => this.enabledFlags.set(new Set()),
    });
  }

  isEnabled(code: string): boolean {
    return this.enabledFlags().has(code);
  }

  refresh(): void {
    this.loaded = false;
    this.load();
  }
}
