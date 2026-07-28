import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UserApiService } from './user-api.service';
import { NotificationService } from '../../../core/auth/services/notification.service';
import { DEFAULT_PAGE_SIZE, UserPageState } from '../constants/user.constants';
import { UserDetail, UserListItem } from '../models/user.models';

@Injectable({ providedIn: 'root' })
export class UserStateService {
  private readonly api = inject(UserApiService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);

  readonly pageState = signal<UserPageState>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly users = signal<UserListItem[]>([]);
  readonly selectedUser = signal<UserDetail | null>(null);
  readonly searchQuery = signal('');
  readonly statusFilter = signal('');
  readonly currentPage = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly totalItems = signal(0);
  readonly totalPages = signal(0);

  readonly isEmpty = computed(() => this.pageState() === 'loaded' && this.users().length === 0);
  readonly hasFilters = computed(() => !!this.searchQuery() || !!this.statusFilter());

  loadUsers(): void {
    this.pageState.set('loading');
    this.errorMessage.set(null);
    this.api.list({ page: this.currentPage(), pageSize: this.pageSize(), search: this.searchQuery() || undefined, status: this.statusFilter() || undefined }).subscribe({
      next: (data) => {
        this.users.set(data.items);
        this.totalItems.set(data.pagination.total);
        this.totalPages.set(data.pagination.totalPages);
        this.pageState.set(data.items.length === 0 ? 'empty' : 'loaded');
      },
      error: () => { this.pageState.set('error'); this.errorMessage.set('Unable to load users.'); },
    });
  }

  loadUserDetail(id: number): void {
    this.pageState.set('loading');
    this.api.getById(id).subscribe({
      next: (u) => { this.selectedUser.set(u); this.pageState.set('loaded'); },
      error: () => { this.pageState.set('error'); this.errorMessage.set('User not found.'); },
    });
  }

  applySearch(q: string): void { this.searchQuery.set(q); this.currentPage.set(1); this.loadUsers(); }
  applyStatusFilter(s: string): void { this.statusFilter.set(s); this.currentPage.set(1); this.loadUsers(); }
  clearFilters(): void { this.searchQuery.set(''); this.statusFilter.set(''); this.currentPage.set(1); this.loadUsers(); }
  setPage(p: number): void { this.currentPage.set(p); this.loadUsers(); }
  setPageSize(s: number): void { this.pageSize.set(s); this.currentPage.set(1); this.loadUsers(); }
  retry(): void {
    if (this.selectedUser()) this.loadUserDetail(this.selectedUser()!.id);
    else this.loadUsers();
  }

  createUser(body: Record<string, unknown>): void {
    this.api.create(body).subscribe({
      next: (u) => { this.notification.success('User created'); this.router.navigate(['/users', u.id]); },
      error: () => this.notification.error('Failed to create user'),
    });
  }

  updateUser(id: number, body: Record<string, unknown>): void {
    this.api.update(id, body).subscribe({
      next: (u) => { this.notification.success('User updated'); this.selectedUser.set(u); this.router.navigate(['/users', id]); },
      error: () => this.notification.error('Failed to update user'),
    });
  }

  deleteUser(id: number): void {
    this.api.delete(id).subscribe({
      next: () => { this.notification.success('User deleted'); this.router.navigate(['/users']); },
      error: () => this.notification.error('Failed to delete user'),
    });
  }

  assignRoles(id: number, roleIds: number[]): void {
    this.api.assignRoles(id, roleIds).subscribe({
      next: (u) => { this.notification.success('Roles updated'); this.selectedUser.set(u); },
      error: () => this.notification.error('Failed to assign roles'),
    });
  }
}
