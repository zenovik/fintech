export const SUBSCRIPTIONS_API = {
  BASE: '/subscriptions',
  STATISTICS: '/subscriptions/statistics',
  PLANS: '/subscriptions/plans',
} as const;

export const DEFAULT_PAGE_SIZE = 20;

export const SUBSCRIPTION_STATUS_OPTIONS = [
  { key: '', label: 'All Statuses' },
  { key: 'active', label: 'Active' },
  { key: 'paused', label: 'Paused' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'failed', label: 'Failed' },
  { key: 'renewed', label: 'Renewed' },
] as const;

export const BILLING_INTERVAL_OPTIONS = [
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'quarterly', label: 'Quarterly' },
  { key: 'yearly', label: 'Yearly' },
] as const;

export const CURRENCY_OPTIONS = [
  { key: 'USD', label: 'USD' },
  { key: 'EUR', label: 'EUR' },
  { key: 'GBP', label: 'GBP' },
] as const;
