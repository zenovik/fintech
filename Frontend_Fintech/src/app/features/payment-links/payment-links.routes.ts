import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from '../dashboard/layouts/dashboard-shell/dashboard-shell.component';

export const paymentLinkRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard, permissionGuard(PERMISSIONS.PAYMENT_LINKS_READ)],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/payment-link-list/payment-link-list.component').then((m) => m.PaymentLinkListComponent),
        title: 'Payment Links | Merchant Pro',
      },
      {
        path: 'create',
        canActivate: [permissionGuard(PERMISSIONS.PAYMENT_LINKS_WRITE)],
        loadComponent: () =>
          import('./pages/payment-link-create/payment-link-create.component').then((m) => m.PaymentLinkCreateComponent),
        title: 'New Payment Link | Merchant Pro',
      },
      {
        path: ':id/edit',
        canActivate: [permissionGuard(PERMISSIONS.PAYMENT_LINKS_WRITE)],
        loadComponent: () =>
          import('./pages/payment-link-edit/payment-link-edit.component').then((m) => m.PaymentLinkEditComponent),
        title: 'Edit Payment Link | Merchant Pro',
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./pages/payment-link-details/payment-link-details.component').then((m) => m.PaymentLinkDetailsComponent),
        title: 'Payment Link Details | Merchant Pro',
      },
    ],
  },
];
