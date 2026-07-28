import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from '../dashboard/layouts/dashboard-shell/dashboard-shell.component';

export const organizationRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        canActivate: [permissionGuard(PERMISSIONS.ORGANIZATIONS_READ)],
        loadComponent: () =>
          import('./pages/organization-list/organization-list.component').then((m) => m.OrganizationListComponent),
        title: 'Organizations | Merchant Pro',
      },
      {
        path: 'create',
        canActivate: [permissionGuard(PERMISSIONS.ORGANIZATIONS_WRITE)],
        loadComponent: () =>
          import('./pages/organization-form/organization-form.component').then((m) => m.OrganizationFormComponent),
        title: 'Create Organization | Merchant Pro',
      },
      {
        path: ':id',
        canActivate: [permissionGuard(PERMISSIONS.ORGANIZATIONS_READ)],
        loadComponent: () =>
          import('./pages/organization-details/organization-details.component').then((m) => m.OrganizationDetailsComponent),
        title: 'Organization Details | Merchant Pro',
      },
      {
        path: ':id/edit',
        canActivate: [permissionGuard(PERMISSIONS.ORGANIZATIONS_WRITE)],
        loadComponent: () =>
          import('./pages/organization-form/organization-form.component').then((m) => m.OrganizationFormComponent),
        title: 'Edit Organization | Merchant Pro',
      },
    ],
  },
];
