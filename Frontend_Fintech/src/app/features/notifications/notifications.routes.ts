import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from '../dashboard/layouts/dashboard-shell/dashboard-shell.component';
import { NotificationsShellComponent } from './layouts/notifications-shell/notifications-shell.component';

export const notificationsRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: NotificationsShellComponent,
        children: [
          {
            path: '',
            canActivate: [permissionGuard(PERMISSIONS.NOTIFICATIONS_READ)],
            loadComponent: () =>
              import('./pages/notification-center/notification-center.component').then((m) => m.NotificationCenterComponent),
            title: 'Notification Center | Merchant Pro',
          },
          {
            path: 'preferences',
            loadComponent: () =>
              import('./pages/notification-preferences/notification-preferences.component').then((m) => m.NotificationPreferencesComponent),
            title: 'Notification Preferences | Merchant Pro',
          },
          {
            path: 'broadcasts',
            canActivate: [permissionGuard(PERMISSIONS.NOTIFICATIONS_BROADCAST)],
            loadComponent: () =>
              import('./pages/notification-broadcasts/notification-broadcasts.component').then((m) => m.NotificationBroadcastsComponent),
            title: 'Broadcasts | Merchant Pro',
          },
          {
            path: 'templates',
            canActivate: [permissionGuard(PERMISSIONS.NOTIFICATIONS_MANAGE)],
            loadComponent: () =>
              import('./pages/notification-templates/notification-templates.component').then((m) => m.NotificationTemplatesComponent),
            title: 'Templates | Merchant Pro',
          },
          {
            path: ':id',
            canActivate: [permissionGuard(PERMISSIONS.NOTIFICATIONS_READ)],
            loadComponent: () =>
              import('./pages/notification-details/notification-details.component').then((m) => m.NotificationDetailsComponent),
            title: 'Notification Details | Merchant Pro',
          },
        ],
      },
    ],
  },
];
