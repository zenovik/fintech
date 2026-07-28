export const REFUNDS_API = { BASE: '/refunds', STATISTICS: '/refunds/statistics' } as const;

export const REFUND_ROUTES = {
  LIST: '/refunds',
  CREATE: '/refunds/request',
  DETAILS: '/refunds',
} as const;

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50];

export const REFUND_STATUS_OPTIONS = [
  { key: '', label: 'All Statuses' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'processed', label: 'Processed' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'failed', label: 'Failed' },
  { key: 'cancelled', label: 'Cancelled' },
] as const;

export const REFUND_TYPE_OPTIONS = [
  { key: '', label: 'All Types' },
  { key: 'full', label: 'Full' },
  { key: 'partial', label: 'Partial' },
] as const;

export const REFUND_STATUSES = ['pending', 'approved', 'rejected', 'processed', 'failed', 'cancelled'] as const;
export const REFUND_TYPES = ['full', 'partial'] as const;
