import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthStateService } from './auth-state.service';

@Injectable({ providedIn: 'root' })
export class RbacService {
  private readonly authState = inject(AuthStateService);
  private readonly merchantPermissions = signal<string[]>([]);

  readonly permissions = computed(() => {
    const base = this.authState.user()?.permissions ?? [];
    const overlay = this.merchantPermissions();
    if (base.includes('*')) return base;
    return [...new Set([...base, ...overlay])];
  });
  readonly roles = computed(() => this.authState.user()?.roles ?? []);
  readonly primaryRole = computed(() => this.roles()[0]?.name ?? 'User');

  hasPermission(permission: string): boolean {
    const perms = this.permissions();
    return perms.includes('*') || perms.includes(permission);
  }

  hasAnyPermission(...required: string[]): boolean {
    const perms = this.permissions();
    if (perms.includes('*')) return true;
    return required.some((p) => perms.includes(p));
  }

  hasAllPermissions(...required: string[]): boolean {
    const perms = this.permissions();
    if (perms.includes('*')) return true;
    return required.every((p) => perms.includes(p));
  }

  canRead(module: 'dashboard' | 'merchants' | 'transactions' | 'settlements' | 'users' | 'roles'): boolean {
    const map: Record<string, string> = {
      dashboard: 'dashboard:read',
      merchants: 'merchants:read',
      transactions: 'transactions:read',
      settlements: 'settlements:read',
      users: 'users:read',
      roles: 'roles:read',
    };
    return this.hasPermission(map[module]);
  }

  setMerchantPermissions(permissions: string[]): void {
    this.merchantPermissions.set(permissions.filter((p) => p !== '*'));
  }

  clearMerchantPermissions(): void {
    this.merchantPermissions.set([]);
  }
}
