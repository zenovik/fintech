import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from './layouts/dashboard-shell/dashboard-shell.component';

export const dashboardRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard, permissionGuard(PERMISSIONS.DASHBOARD_READ)],
    children: [
      { path: '', redirectTo: 'executive', pathMatch: 'full' },
      {
        path: 'executive',
        loadComponent: () =>
          import('./pages/executive-overview/executive-overview.component').then(
            (m) => m.ExecutiveOverviewComponent,
          ),
        title: 'Executive Overview | Merchant Pro',
      },
    ],
  },
];
