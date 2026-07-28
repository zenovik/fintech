import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SETTINGS_ROUTES } from '../../constants/settings.constants';
import { RbacService } from '../../../../core/auth/services/rbac.service';
import { PERMISSIONS } from '../../../../core/auth/constants/permissions.constants';
import { inject } from '@angular/core';

@Component({
  selector: 'app-settings-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './settings-shell.component.html',
  styleUrl: './settings-shell.component.scss',
})
export class SettingsShellComponent {
  readonly routes = SETTINGS_ROUTES;
  readonly rbac = inject(RbacService);
  readonly perms = PERMISSIONS;

  readonly navItems = [
    { path: this.routes.GENERAL, label: 'General', icon: 'tune', read: true },
    { path: this.routes.BUSINESS, label: 'Business', icon: 'business', perm: PERMISSIONS.SETTINGS_READ },
    { path: this.routes.BRANDING, label: 'Branding', icon: 'palette', perm: PERMISSIONS.SETTINGS_READ },
    { path: this.routes.SECURITY, label: 'Security', icon: 'shield', perm: PERMISSIONS.SETTINGS_READ },
    { path: this.routes.PASSWORD_POLICY, label: 'Password Policy', icon: 'password', perm: PERMISSIONS.SETTINGS_READ },
    { path: this.routes.SESSION, label: 'Session Management', icon: 'schedule', perm: PERMISSIONS.SETTINGS_READ },
    { path: this.routes.NOTIFICATIONS, label: 'Notifications', icon: 'notifications', read: true },
    { path: this.routes.API, label: 'API / Developer', icon: 'code', perm: PERMISSIONS.SETTINGS_READ },
    { path: this.routes.FEATURE_FLAGS, label: 'Feature Flags', icon: 'flag', perm: PERMISSIONS.SETTINGS_READ },
    { path: this.routes.CONFIGURATION, label: 'Configuration', icon: 'tune', perm: PERMISSIONS.PLATFORM_CONFIG_READ },
    { path: this.routes.STORAGE, label: 'Storage', icon: 'cloud_upload', perm: PERMISSIONS.SETTINGS_READ },
    { path: this.routes.SYSTEM_STATUS, label: 'System Status', icon: 'monitoring', perm: PERMISSIONS.SYSTEM_VIEW },
    { path: this.routes.ACCOUNT, label: 'Account Security', icon: 'lock', read: true },
  ];

  canView(item: { read?: boolean; perm?: string }): boolean {
    if (item.read) return true;
    return item.perm ? this.rbac.hasPermission(item.perm) : false;
  }
}
