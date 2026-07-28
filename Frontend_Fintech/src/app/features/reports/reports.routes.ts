import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from '../dashboard/layouts/dashboard-shell/dashboard-shell.component';

export const reportsRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard, permissionGuard(PERMISSIONS.REPORTS_READ)],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/reports-dashboard/reports-dashboard.component').then((m) => m.ReportsDashboardComponent),
        title: 'Reports | Merchant Pro',
      },
      {
        path: 'center',
        loadComponent: () => import('./pages/report-center/report-center.component').then((m) => m.ReportCenterComponent),
        title: 'Report Center | Merchant Pro',
      },
      {
        path: 'analytics',
        canActivate: [permissionGuard(PERMISSIONS.ANALYTICS_READ)],
        loadComponent: () => import('./pages/analytics-dashboard/analytics-dashboard.component').then((m) => m.AnalyticsDashboardComponent),
        title: 'Analytics | Merchant Pro',
      },
      {
        path: 'saved',
        loadComponent: () => import('./pages/saved-reports/saved-reports.component').then((m) => m.SavedReportsComponent),
        title: 'Saved Reports | Merchant Pro',
      },
      {
        path: 'builder',
        canActivate: [permissionGuard(PERMISSIONS.REPORTS_WRITE)],
        loadComponent: () => import('./pages/report-builder/report-builder.component').then((m) => m.ReportBuilderComponent),
        title: 'Report Builder | Merchant Pro',
      },
      {
        path: 'builder/:id',
        canActivate: [permissionGuard(PERMISSIONS.REPORTS_WRITE)],
        loadComponent: () => import('./pages/report-builder/report-builder.component').then((m) => m.ReportBuilderComponent),
        title: 'Edit Report | Merchant Pro',
      },
      {
        path: 'history',
        loadComponent: () => import('./pages/report-history/report-history.component').then((m) => m.ReportHistoryComponent),
        title: 'Report History | Merchant Pro',
      },
      {
        path: 'scheduled',
        loadComponent: () => import('./pages/scheduled-reports/scheduled-reports.component').then((m) => m.ScheduledReportsComponent),
        title: 'Scheduled Reports | Merchant Pro',
      },
    ],
  },
];
