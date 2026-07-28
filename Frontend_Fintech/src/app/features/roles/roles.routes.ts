import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from '../dashboard/layouts/dashboard-shell/dashboard-shell.component';

export const roleRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard, permissionGuard(PERMISSIONS.ROLES_READ)],
    children: [
      { path: '', loadComponent: () => import('./pages/role-list/role-list.component').then((m) => m.RoleListComponent), title: 'Roles | Merchant Pro' },
      { path: 'create', canActivate: [permissionGuard(PERMISSIONS.ROLES_WRITE)], loadComponent: () => import('./pages/role-form/role-form.component').then((m) => m.RoleFormComponent), title: 'Create Role | Merchant Pro' },
      { path: ':id/edit', canActivate: [permissionGuard(PERMISSIONS.ROLES_WRITE)], loadComponent: () => import('./pages/role-form/role-form.component').then((m) => m.RoleFormComponent), title: 'Edit Role | Merchant Pro' },
      { path: ':id/permissions', canActivate: [permissionGuard(PERMISSIONS.PERMISSIONS_READ)], loadComponent: () => import('./pages/permission-matrix/permission-matrix.component').then((m) => m.PermissionMatrixComponent), title: 'Permissions | Merchant Pro' },
    ],
  },
];
