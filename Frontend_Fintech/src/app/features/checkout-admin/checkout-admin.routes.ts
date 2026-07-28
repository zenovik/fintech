import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from '../dashboard/layouts/dashboard-shell/dashboard-shell.component';

export const checkoutAdminRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard, permissionGuard(PERMISSIONS.CHECKOUT_READ)],
    children: [
      {
        path: 'sessions',
        loadComponent: () =>
          import('./pages/checkout-session-list/checkout-session-list.component').then((m) => m.CheckoutSessionListComponent),
        title: 'Checkout Sessions | Merchant Pro',
      },
      {
        path: 'sessions/:id',
        loadComponent: () =>
          import('./pages/checkout-session-detail/checkout-session-detail.component').then((m) => m.CheckoutSessionDetailComponent),
        title: 'Checkout Session | Merchant Pro',
      },
      {
        path: 'analytics',
        canActivate: [permissionGuard(PERMISSIONS.CHECKOUT_ANALYTICS)],
        loadComponent: () =>
          import('./pages/checkout-analytics-dashboard/checkout-analytics-dashboard.component').then((m) => m.CheckoutAnalyticsDashboardComponent),
        title: 'Checkout Analytics | Merchant Pro',
      },
      {
        path: 'branding',
        canActivate: [permissionGuard(PERMISSIONS.CHECKOUT_BRANDING)],
        loadComponent: () =>
          import('./pages/checkout-branding-manager/checkout-branding-manager.component').then((m) => m.CheckoutBrandingManagerComponent),
        title: 'Checkout Branding | Merchant Pro',
      },
      {
        path: 'themes',
        loadComponent: () =>
          import('./pages/checkout-theme-list/checkout-theme-list.component').then((m) => m.CheckoutThemeListComponent),
        title: 'Checkout Themes | Merchant Pro',
      },
      { path: '', redirectTo: 'sessions', pathMatch: 'full' },
    ],
  },
];
