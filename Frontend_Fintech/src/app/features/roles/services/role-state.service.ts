import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { RoleApiService } from './role-api.service';
import { NotificationService } from '../../../core/auth/services/notification.service';
import { RoleListItem } from '../models/role.models';

@Injectable({ providedIn: 'root' })
export class RoleStateService {
  private readonly api = inject(RoleApiService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);

  readonly pageState = signal<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  readonly roles = signal<RoleListItem[]>([]);
  readonly selectedRole = signal<RoleListItem | null>(null);
  readonly errorMessage = signal<string | null>(null);

  loadRoles(): void {
    this.pageState.set('loading');
    this.api.list().subscribe({
      next: (d) => { this.roles.set(d.items); this.pageState.set(d.items.length ? 'loaded' : 'loaded'); },
      error: () => { this.pageState.set('error'); this.errorMessage.set('Unable to load roles.'); },
    });
  }

  loadRole(id: number): void {
    this.pageState.set('loading');
    this.api.getById(id).subscribe({
      next: (r) => { this.selectedRole.set(r); this.pageState.set('loaded'); },
      error: () => { this.pageState.set('error'); this.errorMessage.set('Role not found.'); },
    });
  }

  createRole(body: Record<string, unknown>): void {
    this.api.create(body).subscribe({
      next: (r) => { this.notification.success('Role created'); this.router.navigate(['/roles', r.id, 'permissions']); },
      error: () => this.notification.error('Failed to create role'),
    });
  }

  updateRole(id: number, body: Record<string, unknown>): void {
    this.api.update(id, body).subscribe({
      next: (r) => { this.notification.success('Role updated'); this.selectedRole.set(r); },
      error: () => this.notification.error('Failed to update role'),
    });
  }

  deleteRole(id: number): void {
    this.api.delete(id).subscribe({
      next: () => { this.notification.success('Role deleted'); this.router.navigate(['/roles']); },
      error: () => this.notification.error('Failed to delete role'),
    });
  }

  savePermissions(id: number, permissionIds: number[]): void {
    this.api.assignPermissions(id, permissionIds).subscribe({
      next: (r) => { this.notification.success('Permissions updated'); this.selectedRole.set(r); },
      error: () => this.notification.error('Failed to update permissions'),
    });
  }
}
