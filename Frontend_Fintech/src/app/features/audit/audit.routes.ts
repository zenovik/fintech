import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from '../dashboard/layouts/dashboard-shell/dashboard-shell.component';
import { AuditShellComponent } from './layouts/audit-shell/audit-shell.component';

export const auditRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: AuditShellComponent,
        children: [
          {
            path: '',
            canActivate: [permissionGuard(PERMISSIONS.AUDIT_READ)],
            loadComponent: () =>
              import('./pages/audit-dashboard/audit-dashboard.component').then((m) => m.AuditDashboardComponent),
            title: 'Audit & Activity Log | Merchant Pro',
          },
          {
            path: 'timeline',
            canActivate: [permissionGuard(PERMISSIONS.AUDIT_READ)],
            loadComponent: () =>
              import('./pages/audit-timeline/audit-timeline.component').then((m) => m.AuditTimelineComponent),
            title: 'Activity Timeline | Merchant Pro',
          },
          {
            path: 'api-logs',
            canActivate: [permissionGuard(PERMISSIONS.AUDIT_READ)],
            loadComponent: () =>
              import('./pages/api-logs/api-logs.component').then((m) => m.ApiLogsComponent),
            title: 'API Logs | Merchant Pro',
          },
          {
            path: 'webhook-logs',
            canActivate: [permissionGuard(PERMISSIONS.AUDIT_READ)],
            loadComponent: () =>
              import('./pages/webhook-logs/webhook-logs.component').then((m) => m.WebhookLogsComponent),
            title: 'Webhook Logs | Merchant Pro',
          },
          {
            path: ':id',
            canActivate: [permissionGuard(PERMISSIONS.AUDIT_READ)],
            loadComponent: () =>
              import('./pages/audit-details/audit-details.component').then((m) => m.AuditDetailsComponent),
            title: 'Audit Details | Merchant Pro',
          },
        ],
      },
    ],
  },
];
