import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { interval, Subscription, switchMap, catchError, of, startWith } from 'rxjs';
import { NotificationsApiService } from './notifications-api.service';
import { AuthStateService } from '../../../core/auth/services/auth-state.service';

@Injectable({ providedIn: 'root' })
export class NotificationsRealtimeService implements OnDestroy {
  private readonly api = inject(NotificationsApiService);
  private readonly authState = inject(AuthStateService);
  private sub?: Subscription;

  readonly unreadCount = signal(0);
  readonly lastRefreshed = signal<Date | null>(null);

  startPolling(intervalMs = 30000): void {
    this.stopPolling();
    if (!this.authState.isAuthenticated()) return;

    this.sub = interval(intervalMs)
      .pipe(
        startWith(0),
        switchMap(() =>
          this.api.getUnreadCount().pipe(
            catchError(() => of({ unreadCount: this.unreadCount() })),
          ),
        ),
      )
      .subscribe((res) => {
        this.unreadCount.set(res.unreadCount);
        this.lastRefreshed.set(new Date());
      });
  }

  refresh(): void {
    if (!this.authState.isAuthenticated()) return;
    this.api.getUnreadCount().subscribe({
      next: (res) => {
        this.unreadCount.set(res.unreadCount);
        this.lastRefreshed.set(new Date());
      },
    });
  }

  stopPolling(): void {
    this.sub?.unsubscribe();
    this.sub = undefined;
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }
}
