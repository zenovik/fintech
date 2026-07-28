import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from '../dashboard/layouts/dashboard-shell/dashboard-shell.component';

export const fraudRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard, permissionGuard(PERMISSIONS.FRAUD_READ)],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/fraud-queue/fraud-queue.component').then((m) => m.FraudQueueComponent),
      },
    ],
  },
];
