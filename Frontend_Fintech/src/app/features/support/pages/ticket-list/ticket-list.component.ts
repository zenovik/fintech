import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupportApiService } from '../../services/support-api.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { TicketSummary } from '../../models/support.models';
import { DEFAULT_PAGE_SIZE, TICKET_PRIORITY_OPTIONS, TICKET_STATUS_OPTIONS } from '../../constants/support.constants';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule, DatePipe, DecimalPipe],
  templateUrl: './ticket-list.component.html',
  styleUrl: './ticket-list.component.scss',
})
export class TicketListComponent implements OnInit {
  private readonly api = inject(SupportApiService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;
  readonly pageState = signal<'loading' | 'error' | 'empty' | 'ready'>('loading');
  readonly items = signal<TicketSummary[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly stats = signal({ total: 0, open: 0, resolved: 0, closed: 0, slaBreached: 0, avgResolutionHours: 0, slaComplianceRate: 100 });
  searchInput = ''; statusFilter = ''; priorityFilter = '';
  readonly statuses = TICKET_STATUS_OPTIONS;
  readonly priorities = TICKET_PRIORITY_OPTIONS;
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  ngOnInit(): void { this.load(); }
  load(): void {
    this.pageState.set('loading');
    this.api.list({ page: this.page(), pageSize: this.pageSize(), search: this.searchInput || undefined, status: this.statusFilter || undefined, priority: this.priorityFilter || undefined }).subscribe({
      next: (d) => { this.items.set(d.items); this.total.set(d.pagination.total); this.stats.set(d.stats); this.pageState.set(d.items.length ? 'ready' : 'empty'); },
      error: () => this.pageState.set('error'),
    });
  }
  onSearch(): void { this.page.set(1); this.load(); }
  onPageChange(p: number): void { this.page.set(p); this.load(); }
  badgeClass(v: string, type: 'status' | 'priority' = 'status'): string { return `sup-badge sup-badge--${v}`; }
}
