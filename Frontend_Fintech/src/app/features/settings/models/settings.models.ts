export type PageState = 'idle' | 'loading' | 'loaded' | 'empty' | 'error' | 'saving';

export interface OrganizationSettings {
  legalName: string;
  dbaName: string | null;
  taxId: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  baseCurrency: string;
  timezone: string;
  primaryRegion: string | null;
  publicProfileEnabled: boolean;
  payoutNotificationsEnabled: boolean;
}

export interface BrandingSettings {
  companyName: string;
  logoUrl: string | null;
  logoInitials: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  faviconUrl: string | null;
}

export interface SecuritySettings {
  mfaEnforced: boolean;
  mfaMethodsAllowed: string[];
  ipWhitelistEnabled: boolean;
  ipWhitelist: string[];
}

export interface PasswordPolicySettings {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
  maxAgeDays: number;
  historyCount: number;
}

export interface SessionSettings {
  idleTimeoutMinutes: number;
  maxSessionDurationMinutes: number;
  maxConcurrentSessions: number;
  rememberDeviceDays: number;
}

export interface NotificationPreference {
  notificationType: string;
  channel: string;
  isEnabled: boolean;
}

export interface FeatureFlag {
  id: number;
  uuid: string;
  code: string;
  name: string;
  description: string | null;
  isEnabled: boolean;
  isBeta: boolean;
  rolloutPercentage: number;
}

export interface ApiSettings {
  apiBaseUrl: string | null;
  webhookRetryCount: number;
  webhookTimeoutSeconds: number;
  rateLimitPerMinute: number;
}

export interface SmtpSettings {
  host: string | null;
  port: number;
  username: string | null;
  fromEmail: string | null;
  fromName: string | null;
  useTls: boolean;
  hasPassword: boolean;
}

export interface StorageSettings {
  provider: string;
  bucketName: string | null;
  region: string | null;
  maxUploadMb: number;
  allowedExtensions: string[];
}

export interface SettingsOverview {
  organization: OrganizationSettings | null;
  branding: BrandingSettings | null;
  security: SecuritySettings | null;
  passwordPolicy: PasswordPolicySettings | null;
  session: SessionSettings | null;
  api: ApiSettings | null;
  smtp: SmtpSettings | null;
  storage: StorageSettings | null;
  featureFlags: { code: string; name: string; isBeta: boolean; rolloutPercentage: number }[];
}
