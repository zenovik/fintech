import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from '../dashboard/layouts/dashboard-shell/dashboard-shell.component';

export const merchantRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard, permissionGuard(PERMISSIONS.MERCHANTS_READ)],    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/merchant-list/merchant-list.component').then((m) => m.MerchantListComponent),
        title: 'Merchant Management | Merchant Pro',
      },
      {
        path: 'create',
        canActivate: [permissionGuard(PERMISSIONS.MERCHANTS_WRITE)],
        loadComponent: () =>
          import('./pages/merchant-form/merchant-form.component').then((m) => m.MerchantFormComponent),
        title: 'Add Merchant | Merchant Pro',
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./pages/merchant-details/merchant-details.component').then((m) => m.MerchantDetailsComponent),
        title: 'Merchant Details | Merchant Pro',
      },
      {
        path: ':id/edit',
        canActivate: [permissionGuard(PERMISSIONS.MERCHANTS_WRITE)],
        loadComponent: () =>
          import('./pages/merchant-form/merchant-form.component').then((m) => m.MerchantFormComponent),
        title: 'Edit Merchant | Merchant Pro',
      },
    ],
  },
];
