import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from '../dashboard/layouts/dashboard-shell/dashboard-shell.component';

export const refundRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard, permissionGuard(PERMISSIONS.REFUNDS_READ)],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/refund-list/refund-list.component').then((m) => m.RefundListComponent),
        title: 'Refunds | Merchant Pro',
      },
      {
        path: 'request',
        canActivate: [permissionGuard(PERMISSIONS.REFUNDS_WRITE)],
        loadComponent: () => import('./pages/refund-request/refund-request.component').then((m) => m.RefundRequestComponent),
        title: 'New Refund Request | Merchant Pro',
      },
      {
        path: ':id',
        loadComponent: () => import('./pages/refund-details/refund-details.component').then((m) => m.RefundDetailsComponent),
        title: 'Refund Details | Merchant Pro',
      },
    ],
  },
];
