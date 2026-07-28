import { Component, OnInit, inject, signal, computed } from '@angular/core';

import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { RouterLink, RouterLinkActive } from '@angular/router';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SubscriptionsApiService } from '../../services/subscriptions-api.service';

import { RbacService } from '../../../../core/auth/services/rbac.service';

import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';

import { SubscriptionSummary } from '../../models/subscriptions.models';

import { DEFAULT_PAGE_SIZE, SUBSCRIPTION_STATUS_OPTIONS } from '../../constants/subscriptions.constants';



@Component({

  selector: 'app-subscription-dashboard',

  standalone: true,

  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, MatProgressSpinnerModule, DatePipe, CurrencyPipe],

  templateUrl: './subscription-dashboard.component.html',

  styleUrl: './subscription-dashboard.component.scss',

})

export class SubscriptionDashboardComponent implements OnInit {

  private readonly api = inject(SubscriptionsApiService);

  readonly rbac = inject(RbacService);

  readonly perms = PERMISSIONS;



  readonly pageState = signal<'loading' | 'error' | 'empty' | 'ready'>('loading');

  readonly items = signal<SubscriptionSummary[]>([]);

  readonly total = signal(0);

  readonly page = signal(1);

  readonly pageSize = signal(DEFAULT_PAGE_SIZE);

  readonly stats = signal({

    total: 0, active: 0, paused: 0, cancelled: 0, failed: 0, renewed: 0, mrrEstimate: 0,

  });



  searchInput = '';

  statusFilter = '';

  merchantFilter = '';



  readonly statuses = SUBSCRIPTION_STATUS_OPTIONS;

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));



  ngOnInit(): void { this.load(); }



  load(): void {

    this.pageState.set('loading');

    this.api.list({

      page: this.page(),

      pageSize: this.pageSize(),

      search: this.searchInput || undefined,

      status: this.statusFilter || undefined,

      merchantId: this.merchantFilter ? Number(this.merchantFilter) : undefined,

    }).subscribe({

      next: (data) => {

        this.items.set(data.items);

        this.total.set(data.pagination.total);

        this.stats.set(data.stats);

        this.pageState.set(data.items.length ? 'ready' : 'empty');

      },

      error: () => this.pageState.set('error'),

    });

  }



  onSearch(): void { this.page.set(1); this.load(); }

  onPageChange(p: number): void { this.page.set(p); this.load(); }

  badgeClass(value: string): string { return `sub-badge sub-badge--${value}`; }

}

