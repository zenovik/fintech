export const NOTIFICATIONS_API = {
  BASE: '/notifications',
  UNREAD_COUNT: '/notifications/unread-count',
  READ_ALL: '/notifications/read-all',
  ARCHIVE_ALL: '/notifications/archive-all',
  TEMPLATES: '/notifications/templates',
  BROADCASTS: '/notifications/broadcasts',
  CHANNELS: '/notifications/channels',
  EVENTS: '/notifications/events',
  GROUPS: '/notifications/groups',
} as const;

export const NOTIFICATION_CATEGORIES = [
  { key: 'financial', label: 'Financial', icon: 'payments' },
  { key: 'security', label: 'Security', icon: 'security' },
  { key: 'system', label: 'System', icon: 'settings_suggest' },
  { key: 'support', label: 'Support', icon: 'contact_support' },
  { key: 'merchant', label: 'Merchant', icon: 'storefront' },
  { key: 'transaction', label: 'Transaction', icon: 'receipt_long' },
] as const;

export const NOTIFICATION_STATUSES = [
  { key: '', label: 'All Notifications', icon: 'inbox' },
  { key: 'unread', label: 'Unread', icon: 'mark_email_unread' },
  { key: 'archived', label: 'Archived', icon: 'archive' },
] as const;

export const CATEGORY_ICONS: Record<string, string> = {
  financial: 'payments',
  security: 'security',
  system: 'settings_suggest',
  support: 'contact_support',
  merchant: 'storefront',
  transaction: 'receipt_long',
};

export const CATEGORY_COLORS: Record<string, string> = {
  financial: 'primary',
  security: 'error',
  system: 'secondary',
  support: 'tertiary',
  merchant: 'primary',
  transaction: 'error',
};

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
export const DEFAULT_PAGE_SIZE = 10;

export const NOTIFICATIONS_ROUTES = {
  CENTER: '/notifications',
  DETAILS: '/notifications',
  PREFERENCES: '/notifications/preferences',
  BROADCASTS: '/notifications/broadcasts',
  TEMPLATES: '/notifications/templates',
} as const;

export const BROADCAST_GROUPS = [
  { code: 'all_users', label: 'All Users' },
  { code: 'admins', label: 'Administrators' },
  { code: 'operations', label: 'Operations Team' },
] as const;
