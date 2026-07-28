import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MerchantUsersApiService } from '../../services/merchant-users-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { MerchantUserSummary } from '../../models/merchant-user.models';

@Component({
  selector: 'app-merchant-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule],
  templateUrl: './merchant-user-list.component.html',
  styleUrl: './merchant-user-list.component.scss',
})
export class MerchantUserListComponent implements OnInit {
  private readonly api = inject(MerchantUsersApiService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly items = signal<MerchantUserSummary[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  searchInput = '';
  statusFilter = '';
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  ngOnInit(): void { this.load(); }

  load(): void {
    this.pageState.set('loading');
    this.api.list({
      page: this.page(),
      pageSize: this.pageSize(),
      search: this.searchInput || undefined,
      status: this.statusFilter || undefined,
    }).subscribe({
      next: (d) => {
        this.items.set(d.items);
        this.total.set(d.pagination.total);
        this.pageState.set('ready');
      },
      error: () => this.pageState.set('error'),
    });
  }

  onSearch(): void { this.page.set(1); this.load(); }
  onPageChange(p: number): void { this.page.set(p); this.load(); }

  activate(id: number): void {
    this.api.activate(id).subscribe({ next: () => this.load() });
  }

  deactivate(id: number): void {
    this.api.deactivate(id).subscribe({ next: () => this.load() });
  }
}
