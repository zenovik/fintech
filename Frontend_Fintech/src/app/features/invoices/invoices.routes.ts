import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from '../dashboard/layouts/dashboard-shell/dashboard-shell.component';

export const invoiceRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard, permissionGuard(PERMISSIONS.INVOICES_READ)],
    children: [
      { path: '', loadComponent: () => import('./pages/invoice-list/invoice-list.component').then((m) => m.InvoiceListComponent), title: 'Invoices | Merchant Pro' },
      { path: 'create', canActivate: [permissionGuard(PERMISSIONS.INVOICES_WRITE)], loadComponent: () => import('./pages/invoice-create/invoice-create.component').then((m) => m.InvoiceCreateComponent), title: 'New Invoice | Merchant Pro' },
      { path: ':id/edit', canActivate: [permissionGuard(PERMISSIONS.INVOICES_WRITE)], loadComponent: () => import('./pages/invoice-edit/invoice-edit.component').then((m) => m.InvoiceEditComponent), title: 'Edit Invoice | Merchant Pro' },
      { path: ':id', loadComponent: () => import('./pages/invoice-details/invoice-details.component').then((m) => m.InvoiceDetailsComponent), title: 'Invoice Details | Merchant Pro' },
    ],
  },
];
