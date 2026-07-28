import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationsApiService } from '../../services/notifications-api.service';
import { NotificationsRealtimeService } from '../../services/notifications-realtime.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { NotificationDetail } from '../../models/notifications.models';
import { CATEGORY_ICONS } from '../../constants/notifications.constants';

@Component({
  selector: 'app-notification-details',
  standalone: true,
  imports: [CommonModule, RouterLink, MatProgressSpinnerModule, DatePipe, TitleCasePipe],
  templateUrl: './notification-details.component.html',
  styleUrl: './notification-details.component.scss',
})
export class NotificationDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(NotificationsApiService);
  private readonly realtime = inject(NotificationsRealtimeService);
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;
  readonly categoryIcons = CATEGORY_ICONS;

  readonly pageState = signal<'loading' | 'error' | 'ready'>('loading');
  readonly errorMessage = signal('');
  readonly notification = signal<NotificationDetail | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.load(id);
  }

  load(id: number): void {
    this.pageState.set('loading');
    this.api.getById(id).subscribe({
      next: (data) => {
        this.notification.set(data);
        this.pageState.set('ready');
        if (data.status === 'unread') {
          this.api.markRead(id).subscribe({ next: () => this.realtime.refresh() });
        }
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Failed to load notification');
        this.pageState.set('error');
      },
    });
  }

  archive(): void {
    const n = this.notification();
    if (!n) return;
    this.api.archive(n.id).subscribe({
      next: (updated) => {
        this.notification.set({ ...n, ...updated });
        this.realtime.refresh();
      },
    });
  }

  deleteNotification(): void {
    const n = this.notification();
    if (!n) return;
    this.api.delete(n.id).subscribe({
      next: () => {
        this.realtime.refresh();
        window.history.back();
      },
    });
  }

  getIcon(category: string, icon: string | null): string {
    return icon ?? this.categoryIcons[category] ?? 'notifications';
  }
}
