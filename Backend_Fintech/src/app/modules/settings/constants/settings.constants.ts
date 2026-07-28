export const NOTIFICATION_TYPES = [
  'security_alerts',
  'transaction_updates',
  'settlement_reports',
  'system_announcements',
] as const;

export const NOTIFICATION_CHANNELS = ['email', 'push', 'sms'] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];
