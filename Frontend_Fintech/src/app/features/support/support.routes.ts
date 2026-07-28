import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from '../dashboard/layouts/dashboard-shell/dashboard-shell.component';

export const supportRoutes: Routes = [
  {
    path: '', component: DashboardShellComponent,
    canActivate: [authGuard, permissionGuard(PERMISSIONS.SUPPORT_READ)],
    children: [
      { path: '', loadComponent: () => import('./pages/ticket-list/ticket-list.component').then((m) => m.TicketListComponent), title: 'Support | Merchant Pro' },
      { path: 'create', canActivate: [permissionGuard(PERMISSIONS.SUPPORT_WRITE)], loadComponent: () => import('./pages/ticket-create/ticket-create.component').then((m) => m.TicketCreateComponent), title: 'New Ticket | Merchant Pro' },
      { path: ':id/edit', canActivate: [permissionGuard(PERMISSIONS.SUPPORT_WRITE)], loadComponent: () => import('./pages/ticket-edit/ticket-edit.component').then((m) => m.TicketEditComponent), title: 'Edit Ticket | Merchant Pro' },
      { path: ':id', loadComponent: () => import('./pages/ticket-details/ticket-details.component').then((m) => m.TicketDetailsComponent), title: 'Ticket Details | Merchant Pro' },
    ],
  },
];
