import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationsStateService } from '../../services/notifications-state.service';
import { NotificationsRealtimeService } from '../../services/notifications-realtime.service';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_STATUSES,
  PAGE_SIZE_OPTIONS,
  CATEGORY_ICONS,
} from '../../constants/notifications.constants';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatProgressSpinnerModule, DatePipe],
  providers: [NotificationsStateService],
  templateUrl: './notification-center.component.html',
  styleUrl: './notification-center.component.scss',
})
export class NotificationCenterComponent implements OnInit {
  readonly state = inject(NotificationsStateService);
  readonly realtime = inject(NotificationsRealtimeService);
  readonly rbac = inject(RbacService);
  readonly router = inject(Router);
  readonly perms = PERMISSIONS;

  searchInput = '';
  readonly statuses = NOTIFICATION_STATUSES;
  readonly categories = NOTIFICATION_CATEGORIES;
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  readonly categoryIcons = CATEGORY_ICONS;

  ngOnInit(): void {
    this.state.loadNotifications();
    this.realtime.refresh();
  }

  onSearch(): void {
    this.state.applySearch(this.searchInput.trim());
  }

  onStatusFilter(status: string): void {
    this.state.applyStatusFilter(status);
  }

  onToggleCategory(category: string): void {
    this.state.toggleCategory(category);
  }

  isCategorySelected(key: string): boolean {
    return this.state.selectedCategories().includes(key);
  }

  openNotification(id: number): void {
    this.router.navigate(['/notifications', id]);
  }

  markRead(event: Event, id: number): void {
    event.stopPropagation();
    this.state.markRead(id);
  }

  deleteNotification(event: Event, id: number): void {
    event.stopPropagation();
    this.state.deleteNotification(id);
  }

  markAllRead(): void {
    this.state.markAllRead();
  }

  archiveAll(): void {
    this.state.archiveAll();
  }

  retry(): void {
    this.state.loadNotifications();
  }

  getIconClass(category: string): string {
    return `notif-card__icon--${category}`;
  }

  getIcon(category: string, icon: string | null): string {
    return icon ?? this.categoryIcons[category] ?? 'notifications';
  }

  relativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return new Date(dateStr).toLocaleDateString();
  }
}
