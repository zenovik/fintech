import { Request, Response } from 'express';
import { SettingsService } from '../services/settings.service';
import { PlatformConfigService } from '../services/platform-config.service';
import { sendSuccess } from '../../../shared/responses/api.response';
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

export class SettingsController {
  constructor(
    private readonly service = new SettingsService(),
    private readonly platformConfig = new PlatformConfigService(),
  ) {}

  overview = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getOverview());
  };

  getOrganization = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getOrganization());
  };

  updateOrganization = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.updateOrganization(req.body as OrganizationSettingsDto, req.user?.sub));
  };

  getBranding = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getBranding());
  };

  updateBranding = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.updateBranding(req.body as BrandingSettingsDto, req.user?.sub));
  };

  getPublicBranding = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getBranding());
  };

  getSecurity = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getSecurity());
  };

  updateSecurity = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.updateSecurity(req.body as SecuritySettingsDto, req.user?.sub));
  };

  getPasswordPolicy = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getPasswordPolicy());
  };

  updatePasswordPolicy = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.updatePasswordPolicy(req.body as PasswordPolicyDto, req.user?.sub));
  };

  getSessionSettings = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getSessionSettings());
  };

  updateSessionSettings = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.updateSessionSettings(req.body as SessionSettingsDto, req.user?.sub));
  };

  getUserNotifications = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getUserNotificationPreferences(req.user!.sub));
  };

  updateUserNotifications = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.updateUserNotificationPreferences(
      req.user!.sub,
      req.body as NotificationPreferencesBodyDto,
    ));
  };

  getDefaultNotifications = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getDefaultNotificationPreferences());
  };

  updateDefaultNotifications = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.updateDefaultNotificationPreferences(
      req.body as NotificationPreferencesBodyDto,
      req.user?.sub,
    ));
  };

  listFeatureFlags = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.listFeatureFlags(req.query as unknown as FeatureFlagListQueryDto));
  };

  getFeatureFlag = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getFeatureFlag(Number(req.params.id)));
  };

  createFeatureFlag = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.createFeatureFlag(req.body as CreateFeatureFlagBodyDto, req.user?.sub), 201);
  };

  updateFeatureFlag = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.updateFeatureFlag(
      Number(req.params.id),
      req.body as UpdateFeatureFlagBodyDto,
      req.user?.sub,
    ));
  };

  deleteFeatureFlag = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.deleteFeatureFlag(Number(req.params.id), req.user?.sub));
  };

  getPublicFeatureFlags = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getEnabledFeatureFlags());
  };

  getApiSettings = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getApiSettings());
  };

  updateApiSettings = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.updateApiSettings(req.body as ApiSettingsDto, req.user?.sub));
  };

  getSmtpSettings = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getSmtpSettings());
  };

  updateSmtpSettings = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.updateSmtpSettings(req.body as SmtpSettingsDto, req.user?.sub));
  };

  getStorageSettings = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.getStorageSettings());
  };

  updateStorageSettings = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.updateStorageSettings(req.body as StorageSettingsDto, req.user?.sub));
  };

  listPlatformConfig = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.platformConfig.list(req.query.group as string | undefined));
  };

  updatePlatformConfig = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.platformConfig.update(req.body.key, req.body.group, req.body.value, req.user?.sub));
  };

  listRateLimits = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.listRateLimits());
  };

  upsertRateLimit = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.upsertRateLimit(req.body.resource, req.body.limitPerMinute, req.body.limitPerDay));
  };

  updateGeoLogin = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.updateGeoLogin(Boolean(req.body.enabled), req.user?.sub));
  };

  getApiIpRestrictions = async (_req: Request, res: Response): Promise<void> => {
    const security = await this.service.getSecurity();
    sendSuccess(res, { apiIpRestrictions: security?.apiIpRestrictions ?? [] });
  };

  updateApiIpRestrictions = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.updateApiIpRestrictions(req.body.ips ?? [], req.user?.sub));
  };
}
