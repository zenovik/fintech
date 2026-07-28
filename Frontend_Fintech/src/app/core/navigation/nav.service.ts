import { Injectable, computed, inject, signal } from '@angular/core';
import { RbacService } from '../auth/services/rbac.service';
import { NAV_ITEMS, NavItemConfig } from './nav.config';

@Injectable({ providedIn: 'root' })
export class NavService {
  private readonly rbac = inject(RbacService);
  private readonly extraPermissions = signal<string[]>([]);

  readonly visibleItems = computed<NavItemConfig[]>(() => {
    const extras = this.extraPermissions();
    const has = (perm: string) => {
      if (this.rbac.hasPermission(perm)) return true;
      return extras.includes(perm);
    };
    return NAV_ITEMS.filter((item) => has(item.permission));
  });

  setMerchantPermissions(permissions: string[]): void {
    this.extraPermissions.set(permissions.filter((p) => p !== '*'));
  }

  clearMerchantPermissions(): void {
    this.extraPermissions.set([]);
  }
}
