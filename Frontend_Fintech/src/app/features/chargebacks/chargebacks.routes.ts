import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from '../dashboard/layouts/dashboard-shell/dashboard-shell.component';

export const chargebackRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard, permissionGuard(PERMISSIONS.CHARGEBACKS_READ)],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/chargeback-list/chargeback-list.component').then((m) => m.ChargebackListComponent),
        title: 'Chargebacks | Merchant Pro',
      },
      {
        path: 'create',
        canActivate: [permissionGuard(PERMISSIONS.CHARGEBACKS_WRITE)],
        loadComponent: () => import('./pages/chargeback-create/chargeback-create.component').then((m) => m.ChargebackCreateComponent),
        title: 'Open Chargeback | Merchant Pro',
      },
      {
        path: ':id',
        loadComponent: () => import('./pages/chargeback-details/chargeback-details.component').then((m) => m.ChargebackDetailsComponent),
        title: 'Chargeback Details | Merchant Pro',
      },
    ],
  },
];
