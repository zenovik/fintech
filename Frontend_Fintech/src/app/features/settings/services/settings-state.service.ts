import { Injectable, inject, signal } from '@angular/core';
import { SettingsApiService } from './settings-api.service';
import { NotificationService } from '../../../core/auth/services/notification.service';
import {
  ApiSettings,
  BrandingSettings,
  FeatureFlag,
  NotificationPreference,
  OrganizationSettings,
  PageState,
  PasswordPolicySettings,
  SecuritySettings,
  SessionSettings,
  SettingsOverview,
  SmtpSettings,
  StorageSettings,
} from '../models/settings.models';

@Injectable({ providedIn: 'root' })
export class SettingsStateService {
  private readonly api = inject(SettingsApiService);
  private readonly notification = inject(NotificationService);

  readonly pageState = signal<PageState>('idle');
  readonly errorMessage = signal<string | null>(null);
  readonly overview = signal<SettingsOverview | null>(null);
  readonly organization = signal<OrganizationSettings | null>(null);
  readonly branding = signal<BrandingSettings | null>(null);
  readonly security = signal<SecuritySettings | null>(null);
  readonly passwordPolicy = signal<PasswordPolicySettings | null>(null);
  readonly sessionSettings = signal<SessionSettings | null>(null);
  readonly notifications = signal<NotificationPreference[]>([]);
  readonly featureFlags = signal<FeatureFlag[]>([]);
  readonly totalItems = signal(0);
  readonly totalPages = signal(1);
  readonly currentPage = signal(1);
  readonly pageSize = signal(10);
  readonly searchQuery = signal('');
  readonly apiSettings = signal<ApiSettings | null>(null);
  readonly smtpSettings = signal<SmtpSettings | null>(null);
  readonly storageSettings = signal<StorageSettings | null>(null);

  private handleError(message: string): void {
    this.pageState.set('error');
    this.errorMessage.set(message);
  }

  loadOverview(): void {
    this.pageState.set('loading');
    this.api.getOverview().subscribe({
      next: (data) => { this.overview.set(data); this.pageState.set('loaded'); },
      error: () => this.handleError('Unable to load settings overview'),
    });
  }

  loadOrganization(onSuccess?: (data: OrganizationSettings) => void): void {
    this.pageState.set('loading');
    this.api.getOrganization().subscribe({
      next: (data) => { this.organization.set(data); this.pageState.set('loaded'); onSuccess?.(data); },
      error: () => this.handleError('Unable to load organization settings'),
    });
  }

  saveOrganization(body: Partial<OrganizationSettings>): void {
    this.pageState.set('saving');
    this.api.updateOrganization(body).subscribe({
      next: (data) => { this.organization.set(data); this.pageState.set('loaded'); this.notification.success('Organization settings saved'); },
      error: () => { this.pageState.set('error'); this.notification.error('Failed to save organization settings'); },
    });
  }

  loadBranding(onSuccess?: (data: BrandingSettings) => void): void {
    this.pageState.set('loading');
    this.api.getBranding().subscribe({
      next: (data) => { this.branding.set(data); this.pageState.set('loaded'); onSuccess?.(data); },
      error: () => this.handleError('Unable to load branding settings'),
    });
  }

  saveBranding(body: Partial<BrandingSettings>): void {
    this.pageState.set('saving');
    this.api.updateBranding(body).subscribe({
      next: (data) => { this.branding.set(data); this.pageState.set('loaded'); this.notification.success('Branding settings saved'); },
      error: () => { this.pageState.set('error'); this.notification.error('Failed to save branding settings'); },
    });
  }

  loadSecurity(onSuccess?: (data: SecuritySettings) => void): void {
    this.pageState.set('loading');
    this.api.getSecurity().subscribe({
      next: (data) => { this.security.set(data); this.pageState.set('loaded'); onSuccess?.(data); },
      error: () => this.handleError('Unable to load security settings'),
    });
  }

  saveSecurity(body: Partial<SecuritySettings>): void {
    this.pageState.set('saving');
    this.api.updateSecurity(body).subscribe({
      next: (data) => { this.security.set(data); this.pageState.set('loaded'); this.notification.success('Security settings saved'); },
      error: () => { this.pageState.set('error'); this.notification.error('Failed to save security settings'); },
    });
  }

  loadPasswordPolicy(onSuccess?: (data: PasswordPolicySettings) => void): void {
    this.pageState.set('loading');
    this.api.getPasswordPolicy().subscribe({
      next: (data) => { this.passwordPolicy.set(data); this.pageState.set('loaded'); onSuccess?.(data); },
      error: () => this.handleError('Unable to load password policy'),
    });
  }

  savePasswordPolicy(body: Partial<PasswordPolicySettings>): void {
    this.pageState.set('saving');
    this.api.updatePasswordPolicy(body).subscribe({
      next: (data) => { this.passwordPolicy.set(data); this.pageState.set('loaded'); this.notification.success('Password policy saved'); },
      error: () => { this.pageState.set('error'); this.notification.error('Failed to save password policy'); },
    });
  }

  loadSessionSettings(onSuccess?: (data: SessionSettings) => void): void {
    this.pageState.set('loading');
    this.api.getSessionSettings().subscribe({
      next: (data) => { this.sessionSettings.set(data); this.pageState.set('loaded'); onSuccess?.(data); },
      error: () => this.handleError('Unable to load session settings'),
    });
  }

  saveSessionSettings(body: Partial<SessionSettings>): void {
    this.pageState.set('saving');
    this.api.updateSessionSettings(body).subscribe({
      next: (data) => { this.sessionSettings.set(data); this.pageState.set('loaded'); this.notification.success('Session settings saved'); },
      error: () => { this.pageState.set('error'); this.notification.error('Failed to save session settings'); },
    });
  }

  loadNotifications(useDefaults = false): void {
    this.pageState.set('loading');
    const req = useDefaults ? this.api.getDefaultNotifications() : this.api.getUserNotifications();
    req.subscribe({
      next: (data) => { this.notifications.set(data); this.pageState.set(data.length ? 'loaded' : 'empty'); },
      error: () => this.handleError('Unable to load notification preferences'),
    });
  }

  saveNotifications(preferences: NotificationPreference[], useDefaults = false): void {
    this.pageState.set('saving');
    const req = useDefaults
      ? this.api.updateDefaultNotifications(preferences)
      : this.api.updateUserNotifications(preferences);
    req.subscribe({
      next: (data) => { this.notifications.set(data); this.pageState.set('loaded'); this.notification.success('Notification preferences saved'); },
      error: () => { this.pageState.set('error'); this.notification.error('Failed to save notification preferences'); },
    });
  }

  loadFeatureFlags(): void {
    this.pageState.set('loading');
    this.api.listFeatureFlags({
      page: this.currentPage(),
      pageSize: this.pageSize(),
      search: this.searchQuery() || undefined,
    }).subscribe({
      next: (data) => {
        this.featureFlags.set(data.items);
        this.totalItems.set(data.pagination.total);
        this.totalPages.set(data.pagination.totalPages);
        this.pageState.set(data.items.length ? 'loaded' : 'empty');
      },
      error: () => this.handleError('Unable to load feature flags'),
    });
  }

  saveFeatureFlag(id: number | null, body: Partial<FeatureFlag>): void {
    this.pageState.set('saving');
    const req = id ? this.api.updateFeatureFlag(id, body) : this.api.createFeatureFlag(body);
    req.subscribe({
      next: () => { this.pageState.set('loaded'); this.notification.success(id ? 'Feature flag updated' : 'Feature flag created'); this.loadFeatureFlags(); },
      error: () => { this.pageState.set('error'); this.notification.error('Failed to save feature flag'); },
    });
  }

  deleteFeatureFlag(id: number): void {
    this.api.deleteFeatureFlag(id).subscribe({
      next: () => { this.notification.success('Feature flag deleted'); this.loadFeatureFlags(); },
      error: () => this.notification.error('Failed to delete feature flag'),
    });
  }

  loadApiSettings(onSuccess?: (data: ApiSettings) => void): void {
    this.pageState.set('loading');
    this.api.getApiSettings().subscribe({
      next: (data) => { this.apiSettings.set(data); this.pageState.set('loaded'); onSuccess?.(data); },
      error: () => this.handleError('Unable to load API settings'),
    });
  }

  saveApiSettings(body: Partial<ApiSettings>): void {
    this.pageState.set('saving');
    this.api.updateApiSettings(body).subscribe({
      next: (data) => { this.apiSettings.set(data); this.pageState.set('loaded'); this.notification.success('API settings saved'); },
      error: () => { this.pageState.set('error'); this.notification.error('Failed to save API settings'); },
    });
  }

  loadStorageSettings(onSuccess?: (data: StorageSettings) => void): void {
    this.pageState.set('loading');
    this.api.getStorageSettings().subscribe({
      next: (data) => { this.storageSettings.set(data); this.pageState.set('loaded'); onSuccess?.(data); },
      error: () => this.handleError('Unable to load storage settings'),
    });
  }

  saveStorageSettings(body: Partial<StorageSettings>): void {
    this.pageState.set('saving');
    this.api.updateStorageSettings(body).subscribe({
      next: (data) => { this.storageSettings.set(data); this.pageState.set('loaded'); this.notification.success('Storage settings saved'); },
      error: () => { this.pageState.set('error'); this.notification.error('Failed to save storage settings'); },
    });
  }

  applySearch(search: string): void {
    this.searchQuery.set(search);
    this.currentPage.set(1);
    this.loadFeatureFlags();
  }

  setPage(page: number): void {
    this.currentPage.set(page);
    this.loadFeatureFlags();
  }

  retry(): void {
    this.errorMessage.set(null);
    this.pageState.set('idle');
  }
}
