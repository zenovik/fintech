import { z } from 'zod';

const optionalString = z.string().trim().max(512).optional().nullable();

export const organizationSettingsSchema = z.object({
  legalName: z.string().trim().min(1).max(255),
  dbaName: optionalString,
  taxId: z.string().trim().max(64).optional().nullable(),
  addressLine1: z.string().trim().max(255).optional().nullable(),
  addressLine2: z.string().trim().max(255).optional().nullable(),
  city: z.string().trim().max(128).optional().nullable(),
  state: z.string().trim().max(128).optional().nullable(),
  postalCode: z.string().trim().max(32).optional().nullable(),
  country: z.string().trim().max(64).optional().nullable(),
  baseCurrency: z.string().trim().length(3),
  timezone: z.string().trim().min(1).max(64),
  primaryRegion: z.string().trim().max(64).optional().nullable(),
  publicProfileEnabled: z.boolean(),
  payoutNotificationsEnabled: z.boolean(),
});

export const brandingSettingsSchema = z.object({
  companyName: z.string().trim().min(1).max(255),
  logoUrl: z.string().trim().max(512).optional().nullable(),
  logoInitials: z.string().trim().max(8).optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  faviconUrl: z.string().trim().max(512).optional().nullable(),
});

export const securitySettingsSchema = z.object({
  mfaEnforced: z.boolean(),
  mfaMethodsAllowed: z.array(z.enum(['totp', 'sms', 'both'])).min(1),
  ipWhitelistEnabled: z.boolean(),
  ipWhitelist: z.array(z.string().trim().min(1).max(45)).default([]),
});

export const passwordPolicySchema = z.object({
  minLength: z.number().int().min(6).max(128),
  requireUppercase: z.boolean(),
  requireLowercase: z.boolean(),
  requireNumber: z.boolean(),
  requireSpecial: z.boolean(),
  maxAgeDays: z.number().int().min(0).max(365),
  historyCount: z.number().int().min(0).max(24),
});

export const sessionSettingsSchema = z.object({
  idleTimeoutMinutes: z.number().int().min(5).max(1440),
  maxSessionDurationMinutes: z.number().int().min(15).max(10080),
  maxConcurrentSessions: z.number().int().min(1).max(50),
  rememberDeviceDays: z.number().int().min(1).max(365),
});

export const notificationPreferenceItemSchema = z.object({
  notificationType: z.string().trim().min(1).max(64),
  channel: z.enum(['email', 'push', 'sms']),
  isEnabled: z.boolean(),
});

export const notificationPreferencesBodySchema = z.object({
  preferences: z.array(notificationPreferenceItemSchema).min(1),
});

export const featureFlagListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(100).optional(),
  isEnabled: z.enum(['true', 'false']).optional(),
});

export const createFeatureFlagBodySchema = z.object({
  code: z.string().trim().min(2).max(64).regex(/^[a-z][a-z0-9_]*$/),
  name: z.string().trim().min(1).max(128),
  description: z.string().trim().max(512).optional().nullable(),
  isEnabled: z.boolean().default(false),
  isBeta: z.boolean().default(false),
  rolloutPercentage: z.number().int().min(0).max(100).default(100),
});

export const updateFeatureFlagBodySchema = createFeatureFlagBodySchema.partial().omit({ code: true });

export const featureFlagIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const apiSettingsSchema = z.object({
  apiBaseUrl: z.union([z.string().trim().url().max(512), z.literal(''), z.null()]).optional(),
  webhookRetryCount: z.number().int().min(0).max(10),
  webhookTimeoutSeconds: z.number().int().min(5).max(300),
  rateLimitPerMinute: z.number().int().min(10).max(10000),
});

export const smtpSettingsSchema = z.object({
  host: z.string().trim().max(255).optional().nullable(),
  port: z.number().int().min(1).max(65535),
  username: z.string().trim().max(255).optional().nullable(),
  password: z.string().max(512).optional().nullable(),
  fromEmail: z.string().trim().email().max(255).optional().nullable(),
  fromName: z.string().trim().max(255).optional().nullable(),
  useTls: z.boolean(),
});

export const storageSettingsSchema = z.object({
  provider: z.string().trim().min(1).max(64),
  bucketName: z.string().trim().max(255).optional().nullable(),
  region: z.string().trim().max(64).optional().nullable(),
  maxUploadMb: z.number().int().min(1).max(1024),
  allowedExtensions: z.array(z.string().trim().min(1).max(16)).min(1),
});

export type OrganizationSettingsDto = z.infer<typeof organizationSettingsSchema>;
export type BrandingSettingsDto = z.infer<typeof brandingSettingsSchema>;
export type SecuritySettingsDto = z.infer<typeof securitySettingsSchema>;
export type PasswordPolicyDto = z.infer<typeof passwordPolicySchema>;
export type SessionSettingsDto = z.infer<typeof sessionSettingsSchema>;
export type NotificationPreferencesBodyDto = z.infer<typeof notificationPreferencesBodySchema>;
export type FeatureFlagListQueryDto = z.infer<typeof featureFlagListQuerySchema>;
export type CreateFeatureFlagBodyDto = z.infer<typeof createFeatureFlagBodySchema>;
export type UpdateFeatureFlagBodyDto = z.infer<typeof updateFeatureFlagBodySchema>;
export type ApiSettingsDto = z.infer<typeof apiSettingsSchema>;
export type SmtpSettingsDto = z.infer<typeof smtpSettingsSchema>;
export type StorageSettingsDto = z.infer<typeof storageSettingsSchema>;
