import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from '../dashboard/layouts/dashboard-shell/dashboard-shell.component';

export const merchantPortalRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard, permissionGuard(PERMISSIONS.MERCHANT_PORTAL_READ)],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/merchant-payment-portal/merchant-payment-portal.component').then((m) => m.MerchantPaymentPortalComponent),
        title: 'Merchant Portal | Merchant Pro',
      },
    ],
  },
];
