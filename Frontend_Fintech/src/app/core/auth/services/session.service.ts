import { Injectable, inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { fromEvent, merge, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { AUTH_ROUTES } from '../constants/auth.constants';
import { AuthStateService } from './auth-state.service';
import { SettingsApiService } from '../../../features/settings/services/settings-api.service';

const DEFAULT_IDLE_TIMEOUT_MS = 15 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly router = inject(Router);
  private readonly authState = inject(AuthStateService);
  private readonly ngZone = inject(NgZone);
  private readonly settingsApi = inject(SettingsApiService);

  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private activitySub: Subscription | null = null;
  private idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS;

  startIdleMonitoring(): void {
    this.stopIdleMonitoring();
    this.settingsApi.getAuthSessionSettings().subscribe({
      next: (settings) => {
        this.idleTimeoutMs = (settings.idleTimeoutMinutes ?? 15) * 60 * 1000;
        this.beginMonitoring();
      },
      error: () => {
        this.idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS;
        this.beginMonitoring();
      },
    });
  }

  stopIdleMonitoring(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    this.activitySub?.unsubscribe();
    this.activitySub = null;
  }

  handleSessionExpired(): void {
    this.authState.clearSession();
    this.stopIdleMonitoring();
    void this.router.navigate([AUTH_ROUTES.SESSION_EXPIRED]);
  }

  private beginMonitoring(): void {
    this.resetIdleTimer();
    this.ngZone.runOutsideAngular(() => {
      this.activitySub = merge(
        fromEvent(document, 'mousemove'),
        fromEvent(document, 'mousedown'),
        fromEvent(document, 'keydown'),
        fromEvent(document, 'touchstart'),
        fromEvent(document, 'scroll'),
      )
        .pipe(debounceTime(500))
        .subscribe(() => {
          this.ngZone.run(() => this.resetIdleTimer());
        });
    });
  }

  private resetIdleTimer(): void {
    if (!this.authState.isAuthenticated()) return;
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => this.handleSessionExpired(), this.idleTimeoutMs);
  }
}
