import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from '../dashboard/layouts/dashboard-shell/dashboard-shell.component';

export const smartCollectRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard, permissionGuard(PERMISSIONS.SMART_COLLECT_READ)],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/smart-collect-dashboard/smart-collect-dashboard.component').then((m) => m.SmartCollectDashboardComponent),
        title: 'Smart Collect | Merchant Pro',
      },
    ],
  },
];
