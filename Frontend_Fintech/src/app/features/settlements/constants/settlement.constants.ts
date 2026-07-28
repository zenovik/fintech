export const SETTLEMENT_ROUTES = {
  LIST: '/settlements',
  BATCHES: '/settlements/batches',
  DETAIL: (id: number | string) => `/settlements/${id}`,
  BATCH_DETAIL: (id: number | string) => `/settlements/batches/${id}`,
} as const;

export const SETTLEMENT_API = {
  BASE: '/settlements',
  SEARCH: '/settlements/search',
  STATISTICS: '/settlements/statistics',
  EXPORT: '/settlements/export',
  BATCHES: '/settlements/batches',
} as const;

export const SETTLEMENT_STATUSES = ['pending', 'processing', 'processed', 'failed', 'reversed'] as const;
export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
export const DEFAULT_PAGE_SIZE = 10;

export type SettlementStatus = (typeof SETTLEMENT_STATUSES)[number];
export type SettlementPageState = 'idle' | 'loading' | 'loaded' | 'empty' | 'error';
