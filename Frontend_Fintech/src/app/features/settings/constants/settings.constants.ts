export const SETTINGS_API = {
  BASE: '/settings',
  OVERVIEW: '/settings/overview',
  ORGANIZATION: '/settings/organization',
  BRANDING: '/settings/branding',
  PUBLIC_BRANDING: '/settings/public/branding',
  SECURITY: '/settings/security',
  PASSWORD_POLICY: '/settings/password-policy',
  SESSION: '/settings/session',
  NOTIFICATIONS_ME: '/settings/notifications/me',
  NOTIFICATIONS_DEFAULTS: '/settings/notifications/defaults',
  FEATURE_FLAGS: '/settings/feature-flags',
  PUBLIC_FEATURE_FLAGS: '/settings/public/feature-flags',
  API: '/settings/api',
  SMTP: '/settings/smtp',
  STORAGE: '/settings/storage',
  SYSTEM_STATUS: '/settings/system-status',
  CONFIGURATION: '/settings/configuration',
} as const;

export const SETTINGS_ROUTES = {
  BASE: '/settings',
  GENERAL: '/settings/general',
  BUSINESS: '/settings/business',
  BRANDING: '/settings/branding',
  SECURITY: '/settings/security',
  PASSWORD_POLICY: '/settings/password-policy',
  SESSION: '/settings/session',
  NOTIFICATIONS: '/settings/notifications',
  API: '/settings/api',
  FEATURE_FLAGS: '/settings/feature-flags',
  STORAGE: '/settings/storage',
  ACCOUNT: '/settings/account',
  SYSTEM_STATUS: '/settings/system-status',
  CONFIGURATION: '/settings/configuration',
} as const;

export const NOTIFICATION_TYPES = [
  { key: 'security_alerts', label: 'Security Alerts' },
  { key: 'transaction_updates', label: 'Transaction Updates' },
  { key: 'settlement_reports', label: 'Settlement Reports' },
  { key: 'system_announcements', label: 'System Announcements' },
] as const;

export const NOTIFICATION_CHANNELS = ['email', 'push', 'sms'] as const;

export const PAGE_SIZE_OPTIONS = [10, 25, 50];
