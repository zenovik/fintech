import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from '../dashboard/layouts/dashboard-shell/dashboard-shell.component';

export const settlementRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard, permissionGuard(PERMISSIONS.SETTLEMENTS_READ)],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/settlement-list/settlement-list.component').then((m) => m.SettlementListComponent),
        title: 'Settlements | Merchant Pro',
      },
      {
        path: 'batches',
        loadComponent: () =>
          import('./pages/batch-list/batch-list.component').then((m) => m.BatchListComponent),
        title: 'Settlement Batches | Merchant Pro',
      },
      {
        path: 'batches/:id',
        loadComponent: () =>
          import('./pages/batch-details/batch-details.component').then((m) => m.BatchDetailsComponent),
        title: 'Batch Details | Merchant Pro',
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./pages/settlement-details/settlement-details.component').then((m) => m.SettlementDetailsComponent),
        title: 'Settlement Details | Merchant Pro',
      },
    ],
  },
];
