import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from '../dashboard/layouts/dashboard-shell/dashboard-shell.component';

export const payoutRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard, permissionGuard(PERMISSIONS.PAYOUTS_READ)],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/payout-list/payout-list.component').then((m) => m.PayoutListComponent),
        title: 'Payouts | Merchant Pro',
      },
      {
        path: 'create',
        canActivate: [permissionGuard(PERMISSIONS.PAYOUTS_WRITE)],
        loadComponent: () => import('./pages/payout-create/payout-create.component').then((m) => m.PayoutCreateComponent),
        title: 'New Payout | Merchant Pro',
      },
      {
        path: 'bank-accounts',
        canActivate: [permissionGuard(PERMISSIONS.PAYOUTS_READ)],
        loadComponent: () => import('./pages/bank-accounts/bank-accounts.component').then((m) => m.BankAccountsComponent),
        title: 'Bank Accounts | Merchant Pro',
      },
      {
        path: ':id',
        loadComponent: () => import('./pages/payout-details/payout-details.component').then((m) => m.PayoutDetailsComponent),
        title: 'Payout Details | Merchant Pro',
      },
    ],
  },
];
