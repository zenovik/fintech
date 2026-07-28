import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from '../dashboard/layouts/dashboard-shell/dashboard-shell.component';

export const merchantOnboardingRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard, permissionGuard(PERMISSIONS.MERCHANT_ONBOARDING_READ)],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/onboarding-dashboard/onboarding-dashboard.component').then((m) => m.OnboardingDashboardComponent),
        title: 'Merchant Onboarding | Merchant Pro',
      },
      {
        path: 'create',
        canActivate: [permissionGuard(PERMISSIONS.MERCHANT_ONBOARDING_WRITE)],
        loadComponent: () =>
          import('./pages/onboarding-wizard/onboarding-wizard.component').then((m) => m.OnboardingWizardComponent),
        title: 'New Onboarding | Merchant Pro',
      },
      {
        path: ':id/wizard',
        canActivate: [permissionGuard(PERMISSIONS.MERCHANT_ONBOARDING_WRITE)],
        loadComponent: () =>
          import('./pages/onboarding-wizard/onboarding-wizard.component').then((m) => m.OnboardingWizardComponent),
        title: 'Onboarding Wizard | Merchant Pro',
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./pages/onboarding-detail/onboarding-detail.component').then((m) => m.OnboardingDetailComponent),
        title: 'Onboarding Detail | Merchant Pro',
      },
    ],
  },
];
