import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/auth/models/auth.models';
import { SETTINGS_API } from '../constants/settings.constants';
import {
  ApiSettings,
  BrandingSettings,
  FeatureFlag,
  NotificationPreference,
  OrganizationSettings,
  PasswordPolicySettings,
  SecuritySettings,
  SessionSettings,
  SettingsOverview,
  SmtpSettings,
  StorageSettings,
} from '../models/settings.models';

@Injectable({ providedIn: 'root' })
export class SettingsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/v1`;

  getOverview(): Observable<SettingsOverview> {
    return this.http.get<ApiResponse<SettingsOverview>>(`${this.base}${SETTINGS_API.OVERVIEW}`).pipe(map((r) => r.data!));
  }

  getOrganization(): Observable<OrganizationSettings> {
    return this.http.get<ApiResponse<OrganizationSettings>>(`${this.base}${SETTINGS_API.ORGANIZATION}`).pipe(map((r) => r.data!));
  }

  updateOrganization(body: Partial<OrganizationSettings>): Observable<OrganizationSettings> {
    return this.http.put<ApiResponse<OrganizationSettings>>(`${this.base}${SETTINGS_API.ORGANIZATION}`, body).pipe(map((r) => r.data!));
  }

  getBranding(): Observable<BrandingSettings> {
    return this.http.get<ApiResponse<BrandingSettings>>(`${this.base}${SETTINGS_API.BRANDING}`).pipe(map((r) => r.data!));
  }

  getPublicBranding(): Observable<BrandingSettings> {
    return this.http.get<ApiResponse<BrandingSettings>>(`${this.base}${SETTINGS_API.PUBLIC_BRANDING}`).pipe(map((r) => r.data!));
  }

  updateBranding(body: Partial<BrandingSettings>): Observable<BrandingSettings> {
    return this.http.put<ApiResponse<BrandingSettings>>(`${this.base}${SETTINGS_API.BRANDING}`, body).pipe(map((r) => r.data!));
  }

  getSecurity(): Observable<SecuritySettings> {
    return this.http.get<ApiResponse<SecuritySettings>>(`${this.base}${SETTINGS_API.SECURITY}`).pipe(map((r) => r.data!));
  }

  updateSecurity(body: Partial<SecuritySettings>): Observable<SecuritySettings> {
    return this.http.put<ApiResponse<SecuritySettings>>(`${this.base}${SETTINGS_API.SECURITY}`, body).pipe(map((r) => r.data!));
  }

  getPasswordPolicy(): Observable<PasswordPolicySettings> {
    return this.http.get<ApiResponse<PasswordPolicySettings>>(`${this.base}${SETTINGS_API.PASSWORD_POLICY}`).pipe(map((r) => r.data!));
  }

  updatePasswordPolicy(body: Partial<PasswordPolicySettings>): Observable<PasswordPolicySettings> {
    return this.http.put<ApiResponse<PasswordPolicySettings>>(`${this.base}${SETTINGS_API.PASSWORD_POLICY}`, body).pipe(map((r) => r.data!));
  }

  getSessionSettings(): Observable<SessionSettings> {
    return this.http.get<ApiResponse<SessionSettings>>(`${this.base}${SETTINGS_API.SESSION}`).pipe(map((r) => r.data!));
  }

  updateSessionSettings(body: Partial<SessionSettings>): Observable<SessionSettings> {
    return this.http.put<ApiResponse<SessionSettings>>(`${this.base}${SETTINGS_API.SESSION}`, body).pipe(map((r) => r.data!));
  }

  getUserNotifications(): Observable<NotificationPreference[]> {
    return this.http.get<ApiResponse<NotificationPreference[]>>(`${this.base}${SETTINGS_API.NOTIFICATIONS_ME}`).pipe(map((r) => r.data!));
  }

  updateUserNotifications(preferences: NotificationPreference[]): Observable<NotificationPreference[]> {
    return this.http.put<ApiResponse<NotificationPreference[]>>(`${this.base}${SETTINGS_API.NOTIFICATIONS_ME}`, { preferences }).pipe(map((r) => r.data!));
  }

  getDefaultNotifications(): Observable<NotificationPreference[]> {
    return this.http.get<ApiResponse<NotificationPreference[]>>(`${this.base}${SETTINGS_API.NOTIFICATIONS_DEFAULTS}`).pipe(map((r) => r.data!));
  }

  updateDefaultNotifications(preferences: NotificationPreference[]): Observable<NotificationPreference[]> {
    return this.http.put<ApiResponse<NotificationPreference[]>>(`${this.base}${SETTINGS_API.NOTIFICATIONS_DEFAULTS}`, { preferences }).pipe(map((r) => r.data!));
  }

  listFeatureFlags(params: { page?: number; pageSize?: number; search?: string; isEnabled?: string }): Observable<{ items: FeatureFlag[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.pageSize) httpParams = httpParams.set('pageSize', params.pageSize);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.isEnabled) httpParams = httpParams.set('isEnabled', params.isEnabled);
    return this.http.get<ApiResponse<{ items: FeatureFlag[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>>(
      `${this.base}${SETTINGS_API.FEATURE_FLAGS}`, { params: httpParams },
    ).pipe(map((r) => r.data!));
  }

  createFeatureFlag(body: Partial<FeatureFlag>): Observable<FeatureFlag> {
    return this.http.post<ApiResponse<FeatureFlag>>(`${this.base}${SETTINGS_API.FEATURE_FLAGS}`, body).pipe(map((r) => r.data!));
  }

  updateFeatureFlag(id: number, body: Partial<FeatureFlag>): Observable<FeatureFlag> {
    return this.http.put<ApiResponse<FeatureFlag>>(`${this.base}${SETTINGS_API.FEATURE_FLAGS}/${id}`, body).pipe(map((r) => r.data!));
  }

  deleteFeatureFlag(id: number): Observable<unknown> {
    return this.http.delete<ApiResponse<unknown>>(`${this.base}${SETTINGS_API.FEATURE_FLAGS}/${id}`).pipe(map((r) => r.data!));
  }

  getPublicFeatureFlags(): Observable<{ code: string; name: string; isBeta: boolean; rolloutPercentage: number }[]> {
    return this.http.get<ApiResponse<{ code: string; name: string; isBeta: boolean; rolloutPercentage: number }[]>>(
      `${this.base}${SETTINGS_API.PUBLIC_FEATURE_FLAGS}`,
    ).pipe(map((r) => r.data!));
  }

  getApiSettings(): Observable<ApiSettings> {
    return this.http.get<ApiResponse<ApiSettings>>(`${this.base}${SETTINGS_API.API}`).pipe(map((r) => r.data!));
  }

  updateApiSettings(body: Partial<ApiSettings>): Observable<ApiSettings> {
    return this.http.put<ApiResponse<ApiSettings>>(`${this.base}${SETTINGS_API.API}`, body).pipe(map((r) => r.data!));
  }

  getSmtpSettings(): Observable<SmtpSettings> {
    return this.http.get<ApiResponse<SmtpSettings>>(`${this.base}${SETTINGS_API.SMTP}`).pipe(map((r) => r.data!));
  }

  updateSmtpSettings(body: Record<string, unknown>): Observable<SmtpSettings> {
    return this.http.put<ApiResponse<SmtpSettings>>(`${this.base}${SETTINGS_API.SMTP}`, body).pipe(map((r) => r.data!));
  }

  getStorageSettings(): Observable<StorageSettings> {
    return this.http.get<ApiResponse<StorageSettings>>(`${this.base}${SETTINGS_API.STORAGE}`).pipe(map((r) => r.data!));
  }

  updateStorageSettings(body: Partial<StorageSettings>): Observable<StorageSettings> {
    return this.http.put<ApiResponse<StorageSettings>>(`${this.base}${SETTINGS_API.STORAGE}`, body).pipe(map((r) => r.data!));
  }

  changePassword(body: { currentPassword: string; newPassword: string; confirmPassword: string }): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${environment.apiUrl}/auth/change-password`, body).pipe(map(() => undefined));
  }

  listPlatformConfig(group?: string): Observable<{ key: string; group: string; value: unknown; description: string | null; updatedAt: string }[]> {
    let params = new HttpParams();
    if (group) params = params.set('group', group);
    return this.http.get<ApiResponse<{ key: string; group: string; value: unknown; description: string | null; updatedAt: string }[]>>(`${this.base}${SETTINGS_API.CONFIGURATION}`, { params }).pipe(map((r) => r.data!));
  }

  updatePlatformConfig(body: { key: string; group: string; value: unknown }): Observable<{ key: string; group: string; value: unknown; description: string | null; updatedAt: string }[]> {
    return this.http.put<ApiResponse<{ key: string; group: string; value: unknown; description: string | null; updatedAt: string }[]>>(`${this.base}${SETTINGS_API.CONFIGURATION}`, body).pipe(map((r) => r.data!));
  }

  updateMfaPreferences(body: { mfaEnabled: boolean; mfaMethod?: string }): Observable<{ mfaEnabled: boolean; mfaMethod: string | null }> {
    return this.http.put<ApiResponse<{ mfaEnabled: boolean; mfaMethod: string | null }>>(`${environment.apiUrl}/auth/mfa-preferences`, body).pipe(map((r) => r.data!));
  }

  getAuthSessionSettings(): Observable<SessionSettings> {
    return this.http.get<ApiResponse<SessionSettings>>(`${environment.apiUrl}/auth/session-settings`).pipe(map((r) => r.data!));
  }
}
