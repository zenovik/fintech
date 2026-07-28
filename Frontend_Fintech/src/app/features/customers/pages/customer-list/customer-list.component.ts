import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CustomersApiService } from '../../services/customers-api.service';
import { OrganizationContextService } from '../../../organizations/services/organization-context.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { CustomerSummary } from '../../models/customers.models';
import {
  CUSTOMER_KYC_OPTIONS,
  CUSTOMER_RISK_OPTIONS,
  CUSTOMER_STATUS_OPTIONS,
  CUSTOMER_TYPE_OPTIONS,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
} from '../../constants/customers.constants';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule, DatePipe, CurrencyPipe],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.scss',
})
export class CustomerListComponent implements OnInit {
  private readonly api = inject(CustomersApiService);
  private readonly orgContext = inject(OrganizationContextService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  readonly pageState = signal<'loading' | 'error' | 'empty' | 'ready'>('loading');
  readonly errorMessage = signal('');
  readonly items = signal<CustomerSummary[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly stats = signal({ total: 0, active: 0, inactive: 0, blocked: 0, pending: 0, verifiedKyc: 0, highRisk: 0 });

  searchInput = '';
  statusFilter = '';
  kycFilter = '';
  riskFilter = '';
  typeFilter = '';

  readonly statuses = CUSTOMER_STATUS_OPTIONS;
  readonly kycOptions = CUSTOMER_KYC_OPTIONS;
  readonly riskOptions = CUSTOMER_RISK_OPTIONS;
  readonly typeOptions = CUSTOMER_TYPE_OPTIONS;
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  readonly Math = Math;
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  ngOnInit(): void {
    if (!this.orgContext.loaded()) this.orgContext.load();
    this.load();
  }

  load(): void {
    this.pageState.set('loading');
    const orgId = this.orgContext.currentOrgId();
    if (!orgId) {
      this.errorMessage.set('Select an organization before loading customers.');
      this.pageState.set('error');
      return;
    }
    this.api
      .list({
        page: this.page(),
        pageSize: this.pageSize(),
        search: this.searchInput || undefined,
        status: this.statusFilter || undefined,
        kycStatus: this.kycFilter || undefined,
        riskLevel: this.riskFilter || undefined,
        customerType: this.typeFilter || undefined,
      })
      .subscribe({
        next: (data) => {
          this.items.set(data.items);
          this.total.set(data.pagination.total);
          this.stats.set(data.stats);
          this.pageState.set(data.items.length ? 'ready' : 'empty');
        },
        error: () => {
          this.errorMessage.set('Failed to load customers.');
          this.pageState.set('error');
        },
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

  badgeClass(status: string): string {
    return `cust-badge cust-badge--${status}`;
  }

  initials(name: string): string {
    return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  }
}
