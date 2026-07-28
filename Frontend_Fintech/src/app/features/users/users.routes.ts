import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from '../dashboard/layouts/dashboard-shell/dashboard-shell.component';

export const userRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard, permissionGuard(PERMISSIONS.USERS_READ)],
    children: [
      { path: '', loadComponent: () => import('./pages/user-list/user-list.component').then((m) => m.UserListComponent), title: 'Users | Merchant Pro' },
      { path: 'create', canActivate: [permissionGuard(PERMISSIONS.USERS_WRITE)], loadComponent: () => import('./pages/user-form/user-form.component').then((m) => m.UserFormComponent), title: 'Create User | Merchant Pro' },
      { path: ':id/edit', canActivate: [permissionGuard(PERMISSIONS.USERS_WRITE)], loadComponent: () => import('./pages/user-form/user-form.component').then((m) => m.UserFormComponent), title: 'Edit User | Merchant Pro' },
      { path: ':id', loadComponent: () => import('./pages/user-details/user-details.component').then((m) => m.UserDetailsComponent), title: 'User Details | Merchant Pro' },
    ],
  },
];
