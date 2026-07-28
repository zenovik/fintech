import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MerchantOnboardingApiService } from '../../services/merchant-onboarding-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { DEFAULT_PAGE_SIZE, ONBOARDING_STATUSES, STATUS_LABELS } from '../../constants/merchant-onboarding.constants';
import { OnboardingStatistics, OnboardingSummary } from '../../models/merchant-onboarding.models';

@Component({
  selector: 'app-onboarding-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule, MatButtonModule, DatePipe],
  templateUrl: './onboarding-dashboard.component.html',
  styleUrl: './onboarding-dashboard.component.scss',
})
export class OnboardingDashboardComponent implements OnInit {
  private readonly api = inject(MerchantOnboardingApiService);
  private readonly router = inject(Router);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;
  readonly statuses = ONBOARDING_STATUSES;
  readonly statusLabels = STATUS_LABELS;

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly stats = signal<OnboardingStatistics | null>(null);
  readonly items = signal<OnboardingSummary[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  searchInput = '';
  statusFilter = '';
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.pageState.set('loading');
    this.api.statistics().subscribe({
      next: (s) => this.stats.set(s),
      error: () => {},
    });
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

  onSearch(): void {
    this.page.set(1);
    this.load();
  }

  onPageChange(p: number): void {
    this.page.set(p);
    this.load();
  }

  createNew(): void {
    if (this.router.url.includes('create')) return;
    this.api.create().subscribe({
      next: (app) => this.router.navigate(['/merchant-onboarding', app.id, 'wizard']),
    });
  }

  statusClass(status: string): string {
    return `mob-status mob-status--${status}`;
  }
}
