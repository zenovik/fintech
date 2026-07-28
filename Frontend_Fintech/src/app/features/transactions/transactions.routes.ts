import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from '../dashboard/layouts/dashboard-shell/dashboard-shell.component';

export const transactionRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard, permissionGuard(PERMISSIONS.TRANSACTIONS_READ)],    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/transaction-list/transaction-list.component').then((m) => m.TransactionListComponent),
        title: 'Transactions | Merchant Pro',
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./pages/transaction-details/transaction-details.component').then((m) => m.TransactionDetailsComponent),
        title: 'Transaction Details | Merchant Pro',
      },
    ],
  },
];
