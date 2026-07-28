import { Injectable, inject, signal, computed } from '@angular/core';
import { OrganizationsApiService } from './organizations-api.service';
import { OrganizationMembership } from '../models/organizations.models';
import { ORG_STORAGE_KEY } from '../constants/organizations.constants';
import { BrandingService } from '../../settings/services/branding.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { TokenStorageService } from '../../../core/auth/services/token-storage.service';

@Injectable({ providedIn: 'root' })
export class OrganizationContextService {
  private readonly api = inject(OrganizationsApiService);
  private readonly branding = inject(BrandingService);
  private readonly authService = inject(AuthService);
  private readonly tokenStorage = inject(TokenStorageService);

  readonly memberships = signal<OrganizationMembership[]>([]);
  readonly currentOrgId = signal<number | null>(this.readStoredId());
  readonly loaded = signal(false);

  readonly currentOrg = computed(() => {
    const id = this.currentOrgId();
    return this.memberships().find((m) => m.id === id) ?? this.memberships()[0] ?? null;
  });

  load(): void {
    this.api.getMine().subscribe({
      next: (items) => {
        this.memberships.set(items);
        const stored = this.currentOrgId();
        const valid = items.find((i) => i.id === stored);
        const next = valid ?? items.find((i) => i.isDefault) ?? items[0] ?? null;
        if (next) this.select(next.id, false);
        this.loaded.set(true);
      },
      error: () => this.loaded.set(true),
    });
  }

  select(orgId: number, refreshBranding = true): void {
    this.currentOrgId.set(orgId);
    localStorage.setItem(ORG_STORAGE_KEY, String(orgId));
    const org = this.memberships().find((m) => m.id === orgId);
    if (refreshBranding && org) {
      this.branding.branding.update((b) => ({
        ...b,
        companyName: org.displayName,
        logoInitials: org.logoInitials ?? b.logoInitials,
        primaryColor: org.primaryColor ?? b.primaryColor,
      }));
    }
    this.authService.selectOrganization(orgId).subscribe({
      next: (res) => this.tokenStorage.setAccessToken(res.accessToken, res.expiresIn),
    });
  }

  clear(): void {
    this.memberships.set([]);
    this.currentOrgId.set(null);
    localStorage.removeItem(ORG_STORAGE_KEY);
  }

  private readStoredId(): number | null {
    const raw = localStorage.getItem(ORG_STORAGE_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
}
