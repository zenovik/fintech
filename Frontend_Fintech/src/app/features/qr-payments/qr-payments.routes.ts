import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from '../dashboard/layouts/dashboard-shell/dashboard-shell.component';

export const qrPaymentRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard, permissionGuard(PERMISSIONS.QR_PAYMENTS_READ)],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/qr-list/qr-list.component').then((m) => m.QrListComponent),
        title: 'QR Payments | Merchant Pro',
      },
      {
        path: 'create',
        canActivate: [permissionGuard(PERMISSIONS.QR_PAYMENTS_WRITE)],
        loadComponent: () => import('./pages/qr-create/qr-create.component').then((m) => m.QrCreateComponent),
        title: 'New QR Code | Merchant Pro',
      },
      {
        path: ':id',
        loadComponent: () => import('./pages/qr-details/qr-details.component').then((m) => m.QrDetailsComponent),
        title: 'QR Code Details | Merchant Pro',
      },
    ],
  },
];
