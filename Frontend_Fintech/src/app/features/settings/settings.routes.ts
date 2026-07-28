import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';
import { permissionGuard } from '../../core/auth/guards/permission.guard';
import { PERMISSIONS } from '../../core/auth/constants/permissions.constants';
import { DashboardShellComponent } from '../dashboard/layouts/dashboard-shell/dashboard-shell.component';
import { SettingsShellComponent } from './layouts/settings-shell/settings-shell.component';
import { SETTINGS_ROUTES } from './constants/settings.constants';

export const settingsRoutes: Routes = [
  {
    path: '',
    component: DashboardShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: SettingsShellComponent,
        children: [
          { path: '', redirectTo: 'general', pathMatch: 'full' },
          {
            path: 'general',
            loadComponent: () =>
              import('./pages/settings-general/settings-general.component').then((m) => m.SettingsGeneralComponent),
            title: 'Settings | Merchant Pro',
          },
          {
            path: 'business',
            canActivate: [permissionGuard(PERMISSIONS.SETTINGS_READ)],
            loadComponent: () =>
              import('./pages/settings-business/settings-business.component').then((m) => m.SettingsBusinessComponent),
            title: 'Business Settings | Merchant Pro',
          },
          {
            path: 'branding',
            canActivate: [permissionGuard(PERMISSIONS.SETTINGS_READ)],
            loadComponent: () =>
              import('./pages/settings-branding/settings-branding.component').then((m) => m.SettingsBrandingComponent),
            title: 'Branding | Merchant Pro',
          },
          {
            path: 'security',
            canActivate: [permissionGuard(PERMISSIONS.SETTINGS_READ)],
            loadComponent: () =>
              import('./pages/settings-security/settings-security.component').then((m) => m.SettingsSecurityComponent),
            title: 'Security Settings | Merchant Pro',
          },
          {
            path: 'password-policy',
            canActivate: [permissionGuard(PERMISSIONS.SETTINGS_READ)],
            loadComponent: () =>
              import('./pages/settings-password-policy/settings-password-policy.component').then((m) => m.SettingsPasswordPolicyComponent),
            title: 'Password Policy | Merchant Pro',
          },
          {
            path: 'session',
            canActivate: [permissionGuard(PERMISSIONS.SETTINGS_READ)],
            loadComponent: () =>
              import('./pages/settings-session/settings-session.component').then((m) => m.SettingsSessionComponent),
            title: 'Session Management | Merchant Pro',
          },
          {
            path: 'notifications',
            loadComponent: () =>
              import('./pages/settings-notifications/settings-notifications.component').then((m) => m.SettingsNotificationsComponent),
            title: 'Notification Preferences | Merchant Pro',
          },
          {
            path: 'api',
            canActivate: [permissionGuard(PERMISSIONS.SETTINGS_READ)],
            loadComponent: () =>
              import('./pages/settings-api/settings-api.component').then((m) => m.SettingsApiComponent),
            title: 'API Settings | Merchant Pro',
          },
          {
            path: 'feature-flags',
            canActivate: [permissionGuard(PERMISSIONS.SETTINGS_READ)],
            loadComponent: () =>
              import('./pages/settings-feature-flags/settings-feature-flags.component').then((m) => m.SettingsFeatureFlagsComponent),
            title: 'Feature Flags | Merchant Pro',
          },
          {
            path: 'configuration',
            canActivate: [permissionGuard(PERMISSIONS.PLATFORM_CONFIG_READ)],
            loadComponent: () =>
              import('./pages/settings-configuration/settings-configuration.component').then((m) => m.SettingsConfigurationComponent),
            title: 'Configuration Center | Merchant Pro',
          },
          {
            path: 'storage',
            canActivate: [permissionGuard(PERMISSIONS.SETTINGS_READ)],
            loadComponent: () =>
              import('./pages/settings-storage/settings-storage.component').then((m) => m.SettingsStorageComponent),
            title: 'Storage Settings | Merchant Pro',
          },
          {
            path: 'account',
            loadComponent: () =>
              import('./pages/settings-account/settings-account.component').then((m) => m.SettingsAccountComponent),
            title: 'Account Security | Merchant Pro',
          },
          {
            path: 'system-status',
            canActivate: [permissionGuard(PERMISSIONS.SYSTEM_VIEW)],
            loadComponent: () =>
              import('./pages/settings-system-status/settings-system-status.component').then((m) => m.SettingsSystemStatusComponent),
            title: 'System Status | Merchant Pro',
          },
        ],
      },
    ],
  },
];

export { SETTINGS_ROUTES };
