export const DASHBOARD_ROUTES = {
  EXECUTIVE: '/dashboard/executive',
} as const;

export const DASHBOARD_API = {
  SUMMARY: '/dashboard/executive/summary',
  REVENUE: '/dashboard/executive/charts/revenue',
  PAYMENT_METHODS: '/dashboard/executive/charts/payment-methods',
  REGIONAL: '/dashboard/executive/charts/regional-distribution',
  HIGH_VALUE: '/dashboard/executive/transactions/high-value',
  ACTIVITIES: '/dashboard/executive/activities',
  FRAUD_ALERTS: '/dashboard/executive/fraud-alerts',
  EXPORT: '/dashboard/executive/export',
  PREFERENCES: '/dashboard/executive/preferences',
  AI_CHAT: '/dashboard/executive/ai/chat',
  OPERATIONS_STATS: '/dashboard/executive/operations-stats',
} as const;

export type DashboardPeriod = 'daily' | 'weekly' | 'monthly';

export const DASHBOARD_PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly (Last 30 Days)' },
];

export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
