export const TRANSACTION_ROUTES = {
  LIST: '/transactions',
  DETAIL: (id: number | string) => `/transactions/${id}`,
} as const;

export const TRANSACTION_API = {
  BASE: '/transactions',
  SEARCH: '/transactions/search',
  STATISTICS: '/transactions/statistics',
  EXPORT: '/transactions/export',
  DISPUTES: '/transactions/disputes',
} as const;

export const TRANSACTION_STATUSES = ['settled', 'pending', 'failed', 'flagged'] as const;
export const TRANSACTION_PERIODS = ['daily', 'weekly', 'monthly'] as const;
export const TRANSACTION_EXPORT_FORMATS = ['csv', 'xlsx', 'pdf'] as const;
export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
export const DEFAULT_PAGE_SIZE = 10;
export const HIGH_VALUE_THRESHOLD = 50000;

export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];
export type TransactionPeriod = (typeof TRANSACTION_PERIODS)[number];
export type TransactionPageState = 'idle' | 'loading' | 'loaded' | 'empty' | 'error';
