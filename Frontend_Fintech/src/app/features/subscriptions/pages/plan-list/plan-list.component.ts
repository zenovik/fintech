import { Component, OnInit, inject, signal, computed } from '@angular/core';

import { CommonModule, CurrencyPipe } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { RouterLink, RouterLinkActive } from '@angular/router';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SubscriptionsApiService } from '../../services/subscriptions-api.service';

import { RbacService } from '../../../../core/auth/services/rbac.service';

import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';

import { SubscriptionPlan } from '../../models/subscriptions.models';

import { DEFAULT_PAGE_SIZE } from '../../constants/subscriptions.constants';



@Component({

  selector: 'app-plan-list',

  standalone: true,

  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, MatProgressSpinnerModule, CurrencyPipe],

  templateUrl: './plan-list.component.html',

  styleUrl: './plan-list.component.scss',

})

export class PlanListComponent implements OnInit {

  private readonly api = inject(SubscriptionsApiService);

  readonly rbac = inject(RbacService);

  readonly perms = PERMISSIONS;



  readonly pageState = signal<'loading' | 'error' | 'empty' | 'ready'>('loading');

  readonly items = signal<SubscriptionPlan[]>([]);

  readonly total = signal(0);

  readonly page = signal(1);

  readonly pageSize = signal(DEFAULT_PAGE_SIZE);



  searchInput = '';

  merchantFilter = '';

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));



  ngOnInit(): void { this.load(); }



  load(): void {

    this.pageState.set('loading');

    this.api.listPlans({

      page: this.page(),

      pageSize: this.pageSize(),

      search: this.searchInput || undefined,

      merchantId: this.merchantFilter ? Number(this.merchantFilter) : undefined,

    }).subscribe({

      next: (data) => {

        this.items.set(data.items);

        this.total.set(data.pagination.total);

        this.pageState.set(data.items.length ? 'ready' : 'empty');

      },

      error: () => this.pageState.set('error'),

    });

  }



  onSearch(): void { this.page.set(1); this.load(); }

  onPageChange(p: number): void { this.page.set(p); this.load(); }

}

