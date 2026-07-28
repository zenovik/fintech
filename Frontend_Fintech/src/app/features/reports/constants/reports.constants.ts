export const REPORTS_API = {
  BASE: '/reports',
  TEMPLATES: '/reports/templates',
  CATEGORIES: '/reports/categories',
  RUN: '/reports/run',
  EXPORT: '/reports/export',
  HISTORY: '/reports/history',
  SCHEDULED: '/reports/scheduled',
  CENTER_CATALOG: '/reports/center/catalog',
  CENTER_SAVED_FILTERS: '/reports/center/saved-filters',
  CENTER_GENERATE: '/reports/center/generate',
  CENTER_EXPORT: '/reports/center/export',
  CENTER_EXPORT_HISTORY: '/reports/center/export-history',
} as const;

export const ANALYTICS_API = {
  OVERVIEW: '/analytics/overview',
  REVENUE: '/analytics/revenue',
  TRANSACTIONS: '/analytics/transactions',
  SETTLEMENTS: '/analytics/settlements',
  MERCHANTS: '/analytics/merchants',
  CUSTOMERS: '/analytics/customers',
  PAYMENT_METHODS: '/analytics/payment-methods',
  REGIONAL: '/analytics/regional',
  EXPORT: '/analytics/export',
} as const;

export const REPORTS_ROUTES = {
  DASHBOARD: '/reports',
  CENTER: '/reports/center',
  ANALYTICS: '/reports/analytics',
  SAVED: '/reports/saved',
  BUILDER: '/reports/builder',
  BUILDER_EDIT: '/reports/builder',
  HISTORY: '/reports/history',
  SCHEDULED: '/reports/scheduled',
} as const;

export const REPORT_STATUSES = ['draft', 'active', 'archived'] as const;
export const PERIOD_TYPES = ['daily', 'weekly', 'monthly'] as const;
export const EXPORT_FORMATS = ['csv', 'xlsx', 'pdf'] as const;
export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

export type ReportPeriod = (typeof PERIOD_TYPES)[number];
export type ExportFormat = (typeof EXPORT_FORMATS)[number];
