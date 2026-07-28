export const AUDIT_API = {
  BASE: '/audit',
  CATEGORIES: '/audit/categories',
  ACTIONS: '/audit/actions',
  EXPORT: '/audit/export',
  API_LOGS: '/audit/api-logs',
  WEBHOOK_LOGS: '/audit/webhook-logs',
} as const;

export const AUDIT_ROUTES = {
  DASHBOARD: '/audit',
  TIMELINE: '/audit/timeline',
  API_LOGS: '/audit/api-logs',
  WEBHOOK_LOGS: '/audit/webhook-logs',
  DETAILS: '/audit',
} as const;

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export const DATE_RANGE_OPTIONS = [
  { key: '24h', label: 'Last 24 Hours' },
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' },
  { key: 'all', label: 'All Time' },
] as const;

export const MODULE_OPTIONS = [
  { key: '', label: 'All Modules' },
  { key: 'authentication', label: 'Authentication' },
  { key: 'users', label: 'Users' },
  { key: 'settings', label: 'Settings' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'merchants', label: 'Merchants' },
  { key: 'transactions', label: 'Transactions' },
  { key: 'settlements', label: 'Settlements' },
  { key: 'reports', label: 'Reports' },
  { key: 'security', label: 'Security' },
  { key: 'system', label: 'System' },
] as const;

export const RISK_OPTIONS = [
  { key: '', label: 'Risk: All' },
  { key: 'low', label: 'Low' },
  { key: 'medium', label: 'Medium' },
  { key: 'high', label: 'High' },
  { key: 'critical', label: 'Critical' },
] as const;

export const WEBHOOK_STATUS_OPTIONS = [
  { key: '', label: 'All Statuses' },
  { key: 'pending', label: 'Pending' },
  { key: 'success', label: 'Success' },
  { key: 'failed', label: 'Failed' },
  { key: 'retrying', label: 'Retrying' },
] as const;

export const HTTP_METHOD_OPTIONS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

export const ACTION_BADGE_CLASSES: Record<string, string> = {
  authentication: 'audit-badge--auth',
  users: 'audit-badge--users',
  settings: 'audit-badge--settings',
  notifications: 'audit-badge--notifications',
  merchants: 'audit-badge--merchants',
  transactions: 'audit-badge--transactions',
  settlements: 'audit-badge--settlements',
  reports: 'audit-badge--reports',
  security: 'audit-badge--security',
  system: 'audit-badge--system',
};
