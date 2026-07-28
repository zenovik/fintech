import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from '../dashboard/layouts/dashboard-shell/dashboard-shell.component';

export const acceptanceRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard, permissionGuard(PERMISSIONS.ACCEPTANCE_ANALYTICS_READ)],
    children: [
      {
        path: 'analytics',
        loadComponent: () => import('./pages/acceptance-analytics/acceptance-analytics.component').then((m) => m.AcceptanceAnalyticsComponent),
        title: 'Acceptance Analytics | Merchant Pro',
      },
      { path: '', redirectTo: 'analytics', pathMatch: 'full' },
    ],
  },
];
