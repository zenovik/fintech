import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { NavService } from '../../../core/navigation/nav.service';
import { RbacService } from '../../../core/auth/services/rbac.service';
import { MERCHANT_STORAGE_KEY, OUTLET_STORAGE_KEY } from '../constants/merchant-context.constants';

export interface MerchantMembership {
  merchantUserId: number;
  merchantId: number;
  merchantName: string;
  organizationId: number;
  roleCode: string;
  roleName: string;
  accessScope: string;
  defaultOutletId: number | null;
  outletIds: number[];
}

@Injectable({ providedIn: 'root' })
export class MerchantContextService {
  private readonly http = inject(HttpClient);
  private readonly nav = inject(NavService);
  private readonly rbac = inject(RbacService);

  readonly memberships = signal<MerchantMembership[]>([]);
  readonly currentMerchantId = signal<number | null>(this.readStored(MERCHANT_STORAGE_KEY));
  readonly currentOutletId = signal<number | null>(this.readStored(OUTLET_STORAGE_KEY));
  readonly loaded = signal(false);

  load(): void {
    this.http.get<{ memberships: MerchantMembership[]; permissions: string[] }>(
      `${environment.apiUrl}/api/v1/merchant-users/me`,
    ).subscribe({
      next: (ctx) => {
        this.memberships.set(ctx.memberships);
        if (ctx.permissions?.length) {
          this.rbac.setMerchantPermissions(ctx.permissions);
          this.nav.setMerchantPermissions(ctx.permissions);
        }
        const stored = this.currentMerchantId();
        const valid = ctx.memberships.find((m) => m.merchantId === stored);
        const next = valid ?? ctx.memberships[0] ?? null;
        if (next) this.selectMerchant(next.merchantId, next.defaultOutletId ?? undefined, false);
        this.loaded.set(true);
      },
      error: () => this.loaded.set(true),
    });
  }

  selectMerchant(merchantId: number, outletId?: number, persist = true): void {
    this.currentMerchantId.set(merchantId);
    if (persist) localStorage.setItem(MERCHANT_STORAGE_KEY, String(merchantId));
    if (outletId) {
      this.currentOutletId.set(outletId);
      if (persist) localStorage.setItem(OUTLET_STORAGE_KEY, String(outletId));
    }
  }

  selectOutlet(outletId: number): void {
    this.currentOutletId.set(outletId);
    localStorage.setItem(OUTLET_STORAGE_KEY, String(outletId));
  }

  clear(): void {
    this.memberships.set([]);
    this.currentMerchantId.set(null);
    this.currentOutletId.set(null);
    localStorage.removeItem(MERCHANT_STORAGE_KEY);
    localStorage.removeItem(OUTLET_STORAGE_KEY);
    this.nav.clearMerchantPermissions();
    this.rbac.clearMerchantPermissions();
  }

  private readStored(key: string): number | null {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
}
