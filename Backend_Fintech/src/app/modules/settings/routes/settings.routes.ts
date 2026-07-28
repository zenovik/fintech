import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../validators/settings.validator';
import {
  organizationSettingsSchema,
  brandingSettingsSchema,
  securitySettingsSchema,
  passwordPolicySchema,
  sessionSettingsSchema,
  notificationPreferencesBodySchema,
  featureFlagListQuerySchema,
  createFeatureFlagBodySchema,
  updateFeatureFlagBodySchema,
  featureFlagIdParamSchema,
  apiSettingsSchema,
  smtpSettingsSchema,
  storageSettingsSchema,
} from '../dto';

const router = Router();
const controller = new SettingsController();

router.get('/public/branding', asyncHandler(controller.getPublicBranding));
router.get('/public/feature-flags', asyncHandler(controller.getPublicFeatureFlags));

router.use(authenticate);
router.use(requireOrganization());

router.get('/overview', authorize(PERMISSIONS.SETTINGS_READ), asyncHandler(controller.overview));

router.get('/organization', authorize(PERMISSIONS.SETTINGS_READ), asyncHandler(controller.getOrganization));
router.put('/organization', authorize(PERMISSIONS.SETTINGS_WRITE), validateBody(organizationSettingsSchema), asyncHandler(controller.updateOrganization));

router.get('/branding', authorize(PERMISSIONS.SETTINGS_READ), asyncHandler(controller.getBranding));
router.put('/branding', authorize(PERMISSIONS.SETTINGS_WRITE), validateBody(brandingSettingsSchema), asyncHandler(controller.updateBranding));

router.get('/security', authorize(PERMISSIONS.SETTINGS_READ), asyncHandler(controller.getSecurity));
router.put('/security', authorize(PERMISSIONS.SETTINGS_WRITE), validateBody(securitySettingsSchema), asyncHandler(controller.updateSecurity));

router.get('/password-policy', authorize(PERMISSIONS.SETTINGS_READ), asyncHandler(controller.getPasswordPolicy));
router.put('/password-policy', authorize(PERMISSIONS.SETTINGS_WRITE), validateBody(passwordPolicySchema), asyncHandler(controller.updatePasswordPolicy));

router.get('/session', authorize(PERMISSIONS.SETTINGS_READ), asyncHandler(controller.getSessionSettings));
router.put('/session', authorize(PERMISSIONS.SETTINGS_WRITE), validateBody(sessionSettingsSchema), asyncHandler(controller.updateSessionSettings));

router.get('/notifications/me', asyncHandler(controller.getUserNotifications));
router.put('/notifications/me', validateBody(notificationPreferencesBodySchema), asyncHandler(controller.updateUserNotifications));

router.get('/notifications/defaults', authorize(PERMISSIONS.SETTINGS_READ), asyncHandler(controller.getDefaultNotifications));
router.put('/notifications/defaults', authorize(PERMISSIONS.SETTINGS_WRITE), validateBody(notificationPreferencesBodySchema), asyncHandler(controller.updateDefaultNotifications));

router.get('/configuration', authorize(PERMISSIONS.PLATFORM_CONFIG_READ), asyncHandler(controller.listPlatformConfig));
router.put('/configuration', authorize(PERMISSIONS.PLATFORM_CONFIG_WRITE), asyncHandler(controller.updatePlatformConfig));

router.get('/feature-flags', authorize(PERMISSIONS.SETTINGS_READ), validateQuery(featureFlagListQuerySchema), asyncHandler(controller.listFeatureFlags));
router.post('/feature-flags', authorize(PERMISSIONS.SETTINGS_WRITE), validateBody(createFeatureFlagBodySchema), asyncHandler(controller.createFeatureFlag));
router.get('/feature-flags/:id', authorize(PERMISSIONS.SETTINGS_READ), validateParams(featureFlagIdParamSchema), asyncHandler(controller.getFeatureFlag));
router.put('/feature-flags/:id', authorize(PERMISSIONS.SETTINGS_WRITE), validateParams(featureFlagIdParamSchema), validateBody(updateFeatureFlagBodySchema), asyncHandler(controller.updateFeatureFlag));
router.delete('/feature-flags/:id', authorize(PERMISSIONS.SETTINGS_WRITE), validateParams(featureFlagIdParamSchema), asyncHandler(controller.deleteFeatureFlag));

router.get('/api', authorize(PERMISSIONS.SETTINGS_READ), asyncHandler(controller.getApiSettings));
router.put('/api', authorize(PERMISSIONS.SETTINGS_WRITE), validateBody(apiSettingsSchema), asyncHandler(controller.updateApiSettings));

router.get('/smtp', authorize(PERMISSIONS.SETTINGS_READ), asyncHandler(controller.getSmtpSettings));
router.put('/smtp', authorize(PERMISSIONS.SETTINGS_WRITE), validateBody(smtpSettingsSchema), asyncHandler(controller.updateSmtpSettings));

router.get('/storage', authorize(PERMISSIONS.SETTINGS_READ), asyncHandler(controller.getStorageSettings));
router.put('/storage', authorize(PERMISSIONS.SETTINGS_WRITE), validateBody(storageSettingsSchema), asyncHandler(controller.updateStorageSettings));

router.get('/rate-limits', authorize(PERMISSIONS.SETTINGS_READ), asyncHandler(controller.listRateLimits));
router.put('/rate-limits', authorize(PERMISSIONS.SETTINGS_WRITE), asyncHandler(controller.upsertRateLimit));
router.put('/security/geo-login', authorize(PERMISSIONS.SETTINGS_WRITE), asyncHandler(controller.updateGeoLogin));
router.get('/security/api-ip-restrictions', authorize(PERMISSIONS.SETTINGS_READ), asyncHandler(controller.getApiIpRestrictions));
router.put('/security/api-ip-restrictions', authorize(PERMISSIONS.SETTINGS_WRITE), asyncHandler(controller.updateApiIpRestrictions));

export { router as settingsRoutes };
