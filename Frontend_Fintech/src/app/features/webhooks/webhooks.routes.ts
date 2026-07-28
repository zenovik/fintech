import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from '../dashboard/layouts/dashboard-shell/dashboard-shell.component';

export const webhooksRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard, permissionGuard(PERMISSIONS.WEBHOOKS_READ)],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/webhooks-dashboard/webhooks-dashboard.component').then(
            (m) => m.WebhooksDashboardComponent,
          ),
        title: 'Webhooks | Merchant Pro',
      },
    ],
  },
];
