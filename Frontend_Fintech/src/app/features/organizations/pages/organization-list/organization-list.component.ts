import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrganizationsApiService } from '../../services/organizations-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { OrganizationSummary } from '../../models/organizations.models';
import { DEFAULT_PAGE_SIZE, ORG_STATUS_OPTIONS, PAGE_SIZE_OPTIONS } from '../../constants/organizations.constants';

@Component({
  selector: 'app-organization-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule, DatePipe],
  templateUrl: './organization-list.component.html',
  styleUrl: './organization-list.component.scss',
})
export class OrganizationListComponent implements OnInit {
  private readonly api = inject(OrganizationsApiService);
  readonly rbac = inject(RbacService);
  readonly router = inject(Router);
  readonly perms = PERMISSIONS;

  readonly pageState = signal<'loading' | 'error' | 'empty' | 'ready'>('loading');
  readonly errorMessage = signal('');
  readonly items = signal<OrganizationSummary[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly stats = signal({ total: 0, active: 0, pending: 0, archived: 0 });

  searchInput = '';
  statusFilter = '';
  readonly statuses = ORG_STATUS_OPTIONS;
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  readonly Math = Math;
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.pageState.set('loading');
    this.api
      .list({
        page: this.page(),
        pageSize: this.pageSize(),
        search: this.searchInput || undefined,
        status: this.statusFilter || undefined,
      })
      .subscribe({
        next: (res) => {
          this.items.set(res.items);
          this.total.set(res.total);
          this.stats.set(res.stats);
          this.pageState.set(res.items.length === 0 ? 'empty' : 'ready');
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message ?? 'Failed to load organizations');
          this.pageState.set('error');
        },
      });
  }

  onSearch(): void {
    this.page.set(1);
    this.load();
  }

  open(org: OrganizationSummary): void {
    this.router.navigate(['/organizations', org.id]);
  }

  goToPage(p: number): void {
    this.page.set(p);
    this.load();
  }
}
