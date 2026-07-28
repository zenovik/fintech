export const AUDIT_RISK_LEVELS = ['low', 'medium', 'high', 'critical'] as const;
export type AuditRiskLevel = (typeof AUDIT_RISK_LEVELS)[number];

export const AUDIT_MODULES = [
  'authentication', 'users', 'settings', 'notifications',
  'merchants', 'transactions', 'settlements', 'reports', 'security', 'system', 'organizations', 'customers', 'refunds',
  'chargebacks', 'payouts', 'payment_links', 'invoices', 'qr_payments', 'subscriptions', 'support', 'operations', 'ai',
] as const;
export type AuditModule = (typeof AUDIT_MODULES)[number];

export const WEBHOOK_STATUSES = ['pending', 'success', 'failed', 'retrying'] as const;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const DATE_RANGE_PRESETS = [
  { key: '24h', label: 'Last 24 Hours', hours: 24 },
  { key: '7d', label: 'Last 7 Days', hours: 168 },
  { key: '30d', label: 'Last 30 Days', hours: 720 },
  { key: 'all', label: 'All Time', hours: 0 },
] as const;
