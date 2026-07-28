import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from '../dashboard/layouts/dashboard-shell/dashboard-shell.component';

export const customerRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard, permissionGuard(PERMISSIONS.CUSTOMERS_READ)],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/customer-list/customer-list.component').then((m) => m.CustomerListComponent),
        title: 'Customers | Merchant Pro',
      },
      {
        path: 'create',
        canActivate: [permissionGuard(PERMISSIONS.CUSTOMERS_WRITE)],
        loadComponent: () =>
          import('./pages/customer-form/customer-form.component').then((m) => m.CustomerFormComponent),
        title: 'Add Customer | Merchant Pro',
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./pages/customer-details/customer-details.component').then((m) => m.CustomerDetailsComponent),
        title: 'Customer Details | Merchant Pro',
      },
      {
        path: ':id/edit',
        canActivate: [permissionGuard(PERMISSIONS.CUSTOMERS_WRITE)],
        loadComponent: () =>
          import('./pages/customer-form/customer-form.component').then((m) => m.CustomerFormComponent),
        title: 'Edit Customer | Merchant Pro',
      },
    ],
  },
];
