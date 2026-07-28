import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from '../dashboard/layouts/dashboard-shell/dashboard-shell.component';

export const developerRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard, permissionGuard(PERMISSIONS.DEVELOPER_READ)],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/developer-dashboard/developer-dashboard.component').then(
            (m) => m.DeveloperDashboardComponent,
          ),
        title: 'Developer Portal | Merchant Pro',
      },
    ],
  },
];
