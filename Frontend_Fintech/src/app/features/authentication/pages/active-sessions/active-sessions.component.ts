import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { AuthStateService } from '../../../../core/auth/services/auth-state.service';
import { NotificationService } from '../../../../core/auth/services/notification.service';
import { SessionService } from '../../../../core/auth/services/session.service';
import { SessionItem } from '../../../../core/auth/models/auth.models';
import { AUTH_ROUTES } from '../../../../core/auth/constants/auth.constants';

@Component({
  selector: 'app-active-sessions',
  standalone: true,
  imports: [CommonModule, RouterLink, MatProgressSpinnerModule, MatButtonModule],
  templateUrl: './active-sessions.component.html',
  styleUrl: './active-sessions.component.scss',
})
export class ActiveSessionsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly authState = inject(AuthStateService);
  private readonly notification = inject(NotificationService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  readonly loginRoute = AUTH_ROUTES.LOGIN;
  sessions: SessionItem[] = [];
  loading = true;
  revokingId: string | null = null;
  revokingOthers = false;

  user = this.authState.user;

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.loading = true;
    this.authService.getSessions().subscribe({
      next: (sessions) => {
        this.sessions = sessions;
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.notification.error(this.authService.extractErrorMessage(err));
      },
    });
  }

  revokeSession(session: SessionItem): void {
    if (session.isCurrent) return;
    this.revokingId = session.id;
    this.authService.revokeSession(session.id).subscribe({
      next: () => {
        this.revokingId = null;
        this.notification.success('Session revoked successfully');
        this.loadSessions();
      },
      error: (err: HttpErrorResponse) => {
        this.revokingId = null;
        this.notification.error(this.authService.extractErrorMessage(err));
      },
    });
  }

  revokeOthers(): void {
    this.revokingOthers = true;
    this.authService.revokeOtherSessions().subscribe({
      next: (result) => {
        this.revokingOthers = false;
        this.notification.success(result.message);
        this.loadSessions();
      },
      error: (err: HttpErrorResponse) => {
        this.revokingOthers = false;
        this.notification.error(this.authService.extractErrorMessage(err));
      },
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.authState.clearSession();
        this.sessionService.stopIdleMonitoring();
        void this.router.navigate([AUTH_ROUTES.LOGIN]);
      },
      error: () => {
        this.authState.clearSession();
        this.sessionService.stopIdleMonitoring();
        void this.router.navigate([AUTH_ROUTES.LOGIN]);
      },
    });
  }

  getDeviceIcon(session: SessionItem): string {
    const os = (session.os ?? '').toLowerCase();
    if (os.includes('ios') || os.includes('iphone')) return 'phone_iphone';
    if (os.includes('ipad')) return 'tablet_mac';
    if (os.includes('android')) return 'phone_android';
    if (os.includes('windows')) return 'desktop_windows';
    if (os.includes('mac')) return 'laptop_mac';
    return 'devices';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }
}
