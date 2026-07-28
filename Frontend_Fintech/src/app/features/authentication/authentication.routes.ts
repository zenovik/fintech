import { Routes } from '@angular/router';
import { guestGuard } from '../../core/auth/guards/guest.guard';
import { authGuard } from '../../core/auth/guards/auth.guard';

export const authenticationRoutes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
    title: 'Sign In | Merchant Pro',
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
    canActivate: [guestGuard],
    title: 'Forgot Password | Merchant Pro',
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./pages/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent,
      ),
    canActivate: [guestGuard],
    title: 'Reset Password | Merchant Pro',
  },
  {
    path: 'verify-otp',
    loadComponent: () =>
      import('./pages/verify-otp/verify-otp.component').then((m) => m.VerifyOtpComponent),
    canActivate: [guestGuard],
    title: 'Verify Identity | Merchant Pro',
  },
  {
    path: 'session-expired',
    loadComponent: () =>
      import('./pages/session-expired/session-expired.component').then(
        (m) => m.SessionExpiredComponent,
      ),
    title: 'Session Expired | Merchant Pro',
  },
  {
    path: 'access-denied',
    loadComponent: () =>
      import('./pages/access-denied/access-denied.component').then((m) => m.AccessDeniedComponent),
    title: 'Access Denied | Merchant Pro',
  },
  {
    path: 'sessions',
    loadComponent: () =>
      import('./pages/active-sessions/active-sessions.component').then(
        (m) => m.ActiveSessionsComponent,
      ),
    canActivate: [authGuard],
    title: 'Active Sessions | Merchant Pro',
  },
];
