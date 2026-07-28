import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from '../dashboard/layouts/dashboard-shell/dashboard-shell.component';

export const activityRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard, permissionGuard(PERMISSIONS.ACTIVITY_CENTER_READ)],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/activity-timeline/activity-timeline.component').then((m) => m.ActivityTimelineComponent),
        title: 'Activity Center | Merchant Pro',
      },
    ],
  },
];
