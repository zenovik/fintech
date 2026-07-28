import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { OutletsApiService } from '../../services/outlets-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { OutletSummary } from '../../models/outlet.models';

@Component({
  selector: 'app-outlet-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule, MatButtonModule],
  templateUrl: './outlet-list.component.html',
  styleUrl: './outlet-list.component.scss',
})
export class OutletListComponent implements OnInit {
  private readonly api = inject(OutletsApiService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly items = signal<OutletSummary[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  searchInput = '';
  statusFilter = '';
  merchantFilter = '';
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
}
