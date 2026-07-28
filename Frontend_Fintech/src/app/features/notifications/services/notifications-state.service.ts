import { Injectable, inject, signal, computed } from '@angular/core';
import { NotificationsApiService } from './notifications-api.service';
import { NotificationsRealtimeService } from './notifications-realtime.service';
import { NotificationItem } from '../models/notifications.models';
import { DEFAULT_PAGE_SIZE } from '../constants/notifications.constants';

type PageState = 'idle' | 'loading' | 'error' | 'empty' | 'ready' | 'saving';

@Injectable()
export class NotificationsStateService {
  private readonly api = inject(NotificationsApiService);
  private readonly realtime = inject(NotificationsRealtimeService);

  readonly pageState = signal<PageState>('idle');
  readonly errorMessage = signal('');
  readonly notifications = signal<NotificationItem[]>([]);
  readonly counts = signal({ all: 0, unread: 0, read: 0, archived: 0 });
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);
  readonly search = signal('');
  readonly statusFilter = signal('');
  readonly selectedCategories = signal<string[]>(['financial', 'security', 'system', 'support', 'merchant', 'transaction']);

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));

  loadNotifications(): void {
    this.pageState.set('loading');
    this.errorMessage.set('');

    const categories = this.selectedCategories();
    this.api
      .list({
        page: this.page(),
        pageSize: this.pageSize(),
        search: this.search() || undefined,
        status: this.statusFilter() || undefined,
        categories: categories.length ? categories.join(',') : undefined,
      })
      .subscribe({
        next: (res) => {
          this.notifications.set(res.items);
          this.total.set(res.total);
          this.counts.set(res.counts);
          this.pageState.set(res.items.length === 0 ? 'empty' : 'ready');
        },
        error: (err) => {
          this.errorMessage.set(err?.error?.message ?? 'Failed to load notifications');
          this.pageState.set('error');
        },
      });
  }

  applySearch(term: string): void {
    this.search.set(term);
    this.page.set(1);
    this.loadNotifications();
  }

  applyStatusFilter(status: string): void {
    this.statusFilter.set(status);
    this.page.set(1);
    this.loadNotifications();
  }

  toggleCategory(category: string): void {
    const current = this.selectedCategories();
    if (current.includes(category)) {
      this.selectedCategories.set(current.filter((c) => c !== category));
    } else {
      this.selectedCategories.set([...current, category]);
    }
    this.page.set(1);
    this.loadNotifications();
  }

  goToPage(p: number): void {
    this.page.set(p);
    this.loadNotifications();
  }

  setPageSize(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
    this.loadNotifications();
  }

  markRead(id: number): void {
    this.api.markRead(id).subscribe({
      next: () => {
        this.loadNotifications();
        this.realtime.refresh();
      },
    });
  }

  markAllRead(): void {
    this.pageState.set('saving');
    this.api.markAllRead().subscribe({
      next: () => {
        this.loadNotifications();
        this.realtime.refresh();
      },
      error: () => this.pageState.set('ready'),
    });
  }

  archive(id: number): void {
    this.api.archive(id).subscribe({
      next: () => {
        this.loadNotifications();
        this.realtime.refresh();
      },
    });
  }

  archiveAll(): void {
    this.pageState.set('saving');
    this.api.archiveAll().subscribe({
      next: () => {
        this.loadNotifications();
        this.realtime.refresh();
      },
      error: () => this.pageState.set('ready'),
    });
  }

  deleteNotification(id: number): void {
    this.api.delete(id).subscribe({
      next: () => {
        this.loadNotifications();
        this.realtime.refresh();
      },
    });
  }
}
