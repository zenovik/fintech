import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from '../dashboard/layouts/dashboard-shell/dashboard-shell.component';

export const onboardingApprovalRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard, permissionGuard(PERMISSIONS.COMPLIANCE_QUEUE_READ)],
    children: [
      {
        path: 'compliance',
        loadComponent: () =>
          import('./pages/compliance-queue/compliance-queue.component').then((m) => m.ComplianceQueueComponent),
        title: 'Compliance Queue | Merchant Pro',
      },
    ],
  },
];
