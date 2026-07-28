import { SettingsRepository } from '../repositories/settings.repository';
import { NotFoundError, ValidationError } from '../../../shared/exceptions/app.exception';
import { auditRecorder } from '../../audit';
import {
  ApiSettingsDto,
  BrandingSettingsDto,
  CreateFeatureFlagBodyDto,
  FeatureFlagListQueryDto,
  NotificationPreferencesBodyDto,
  OrganizationSettingsDto,
  PasswordPolicyDto,
  SecuritySettingsDto,
  SessionSettingsDto,
  SmtpSettingsDto,
  StorageSettingsDto,
  UpdateFeatureFlagBodyDto,
} from '../dto';

export class SettingsService {
  constructor(private readonly repo = new SettingsRepository()) {}

  private auditSettingsChange(section: string, description: string, actorId?: number, after?: Record<string, unknown>) {
    void auditRecorder.settingsChange(section, description, undefined, after, { userId: actorId }).catch(() => {});
  }

  getOverview() {
    return this.repo.getOverview();
  }

  async getOrganization() {
    const data = await this.repo.getOrganization();
    if (!data) throw new NotFoundError('Organization settings not found');
    return data;
  }

  updateOrganization(dto: OrganizationSettingsDto, actorId?: number) {
    this.auditSettingsChange('organization', 'Updated organization settings.', actorId, dto as Record<string, unknown>);
    return this.repo.updateOrganization(dto, actorId);
  }

  async getBranding() {
    const data = await this.repo.getBranding();
    if (!data) throw new NotFoundError('Branding settings not found');
    return data;
  }

  updateBranding(dto: BrandingSettingsDto, actorId?: number) {
    this.auditSettingsChange('branding', 'Updated branding settings.', actorId, dto as Record<string, unknown>);
    return this.repo.updateBranding(dto, actorId);
  }

  async getSecurity() {
    const data = await this.repo.getSecurity();
    if (!data) throw new NotFoundError('Security settings not found');
    return data;
  }

  updateSecurity(dto: SecuritySettingsDto, actorId?: number) {
    this.auditSettingsChange('security', 'Updated security settings.', actorId, dto as Record<string, unknown>);
    return this.repo.updateSecurity(dto, actorId);
  }

  async getPasswordPolicy() {
    const data = await this.repo.getPasswordPolicy();
    if (!data) throw new NotFoundError('Password policy not found');
    return data;
  }

  updatePasswordPolicy(dto: PasswordPolicyDto, actorId?: number) {
    this.auditSettingsChange('password_policy', 'Updated password policy.', actorId, dto as Record<string, unknown>);
    return this.repo.updatePasswordPolicy(dto, actorId);
  }

  async getSessionSettings() {
    const data = await this.repo.getSessionSettings();
    if (!data) throw new NotFoundError('Session settings not found');
    return data;
  }

  updateSessionSettings(dto: SessionSettingsDto, actorId?: number) {
    this.auditSettingsChange('session', 'Updated session settings.', actorId, dto as Record<string, unknown>);
    return this.repo.updateSessionSettings(dto, actorId);
  }

  getUserNotificationPreferences(userId: number) {
    return this.repo.getNotificationPreferences(userId);
  }

  getDefaultNotificationPreferences() {
    return this.repo.getNotificationPreferences(null);
  }

  updateUserNotificationPreferences(userId: number, dto: NotificationPreferencesBodyDto) {
    void auditRecorder.preferenceChange({ userId }).catch(() => {});
    return this.repo.upsertNotificationPreferences(userId, dto);
  }

  updateDefaultNotificationPreferences(dto: NotificationPreferencesBodyDto, actorId?: number) {
    void actorId;
    return this.repo.upsertNotificationPreferences(null, dto);
  }

  async listFeatureFlags(query: FeatureFlagListQueryDto) {
    const { items, total } = await this.repo.findFeatureFlags(query);
    return {
      items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize) || 1,
      },
    };
  }

  async getFeatureFlag(id: number) {
    const flag = await this.repo.findFeatureFlagById(id);
    if (!flag) throw new NotFoundError('Feature flag not found');
    return flag;
  }

  async createFeatureFlag(dto: CreateFeatureFlagBodyDto, actorId?: number) {
    const existing = await this.repo.findFeatureFlagByCode(dto.code);
    if (existing) throw new ValidationError('Feature flag code already exists');
    const created = await this.repo.createFeatureFlag(dto, actorId);
    if (!created) throw new ValidationError('Failed to create feature flag');
    this.auditSettingsChange('feature_flags', `Created feature flag: ${dto.code}.`, actorId, dto as Record<string, unknown>);
    return created;
  }

  async updateFeatureFlag(id: number, dto: UpdateFeatureFlagBodyDto, actorId?: number) {
    const flag = await this.getFeatureFlag(id);
    const updated = await this.repo.updateFeatureFlag(id, dto, actorId);
    if (!updated) throw new NotFoundError('Feature flag not found');
    this.auditSettingsChange('feature_flags', `Updated feature flag: ${flag.code}.`, actorId, dto as Record<string, unknown>);
    return updated;
  }

  async deleteFeatureFlag(id: number, actorId?: number) {
    const flag = await this.getFeatureFlag(id);
    await this.repo.deleteFeatureFlag(id);
    this.auditSettingsChange('feature_flags', `Deleted feature flag: ${flag.code}.`, actorId);
    return { deleted: true };
  }

  getEnabledFeatureFlags() {
    return this.repo.getEnabledFeatureFlags();
  }

  async getApiSettings() {
    const data = await this.repo.getApiSettings();
    if (!data) throw new NotFoundError('API settings not found');
    return data;
  }

  updateApiSettings(dto: ApiSettingsDto, actorId?: number) {
    this.auditSettingsChange('api', 'Updated API settings.', actorId, dto as Record<string, unknown>);
    return this.repo.updateApiSettings(dto, actorId);
  }

  async getSmtpSettings() {
    const data = await this.repo.getSmtpSettings();
    if (!data) throw new NotFoundError('SMTP settings not found');
    return data;
  }

  updateSmtpSettings(dto: SmtpSettingsDto, actorId?: number) {
    this.auditSettingsChange('smtp', 'Updated SMTP settings.', actorId, dto as Record<string, unknown>);
    return this.repo.updateSmtpSettings(dto, actorId);
  }

  async getStorageSettings() {
    const data = await this.repo.getStorageSettings();
    if (!data) throw new NotFoundError('Storage settings not found');
    return data;
  }

  updateStorageSettings(dto: StorageSettingsDto, actorId?: number) {
    this.auditSettingsChange('storage', 'Updated storage settings.', actorId, dto as Record<string, unknown>);
    return this.repo.updateStorageSettings(dto, actorId);
  }

  listRateLimits() {
    return this.repo.listRateLimits();
  }

  upsertRateLimit(resource: string, limitPerMinute: number, limitPerDay: number) {
    return this.repo.upsertRateLimit(resource, limitPerMinute, limitPerDay);
  }

  updateGeoLogin(enabled: boolean, actorId?: number) {
    this.auditSettingsChange('security', 'Updated geo login setting.', actorId, { enabled });
    return this.repo.updateGeoLogin(enabled, actorId);
  }

  updateApiIpRestrictions(ips: string[], actorId?: number) {
    this.auditSettingsChange('security', 'Updated API IP restrictions.', actorId, { ips });
    return this.repo.updateApiIpRestrictions(ips, actorId);
  }
}
