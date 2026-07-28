import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from '../dashboard/layouts/dashboard-shell/dashboard-shell.component';

export const subscriptionRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard, permissionGuard(PERMISSIONS.SUBSCRIPTIONS_READ)],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/subscription-dashboard/subscription-dashboard.component').then((m) => m.SubscriptionDashboardComponent),
        title: 'Subscriptions | Merchant Pro',
      },
      {
        path: 'plans',
        loadComponent: () => import('./pages/plan-list/plan-list.component').then((m) => m.PlanListComponent),
        title: 'Subscription Plans | Merchant Pro',
      },
      {
        path: 'plans/create',
        canActivate: [permissionGuard(PERMISSIONS.SUBSCRIPTIONS_WRITE)],
        loadComponent: () => import('./pages/plan-create/plan-create.component').then((m) => m.PlanCreateComponent),
        title: 'New Plan | Merchant Pro',
      },
      {
        path: 'create',
        canActivate: [permissionGuard(PERMISSIONS.SUBSCRIPTIONS_WRITE)],
        loadComponent: () =>
          import('./pages/subscription-create/subscription-create.component').then((m) => m.SubscriptionCreateComponent),
        title: 'New Subscription | Merchant Pro',
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./pages/subscription-details/subscription-details.component').then((m) => m.SubscriptionDetailsComponent),
        title: 'Subscription Details | Merchant Pro',
      },
    ],
  },
];
