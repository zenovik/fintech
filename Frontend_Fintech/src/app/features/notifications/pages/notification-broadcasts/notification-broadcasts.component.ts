import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationsApiService } from '../../services/notifications-api.service';
import { BroadcastItem } from '../../models/notifications.models';
import { BROADCAST_GROUPS, DEFAULT_PAGE_SIZE } from '../../constants/notifications.constants';

@Component({
  selector: 'app-notification-broadcasts',
  standalone: true,
  imports: [CommonModule, FormsModule, MatProgressSpinnerModule, DatePipe],
  templateUrl: './notification-broadcasts.component.html',
  styleUrl: './notification-broadcasts.component.scss',
})
export class NotificationBroadcastsComponent implements OnInit {
  private readonly api = inject(NotificationsApiService);

  readonly pageState = signal<'loading' | 'error' | 'empty' | 'ready' | 'sending'>('loading');
  readonly errorMessage = signal('');
  readonly broadcasts = signal<BroadcastItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly showForm = signal(false);

  searchInput = '';
  title = '';
  message = '';
  groupCode = 'all_users';
  readonly groups = BROADCAST_GROUPS;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.pageState.set('loading');
    this.api.listBroadcasts({ page: this.page(), pageSize: DEFAULT_PAGE_SIZE, search: this.searchInput || undefined }).subscribe({
      next: (res) => {
        this.broadcasts.set(res.items);
        this.total.set(res.total);
        this.pageState.set(res.items.length === 0 ? 'empty' : 'ready');
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Failed to load broadcasts');
        this.pageState.set('error');
      },
    });
  }

  onSearch(): void {
    this.page.set(1);
    this.load();
  }

  send(): void {
    if (!this.title.trim() || !this.message.trim()) return;
    this.pageState.set('sending');
    this.api.createBroadcast({ title: this.title, message: this.message, groupCode: this.groupCode }).subscribe({
      next: () => {
        this.title = '';
        this.message = '';
        this.showForm.set(false);
        this.load();
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Failed to send broadcast');
        this.pageState.set('error');
      },
    });
  }
}
