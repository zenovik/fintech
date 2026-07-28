export const PAYOUTS_API = { BASE: '/payouts', STATISTICS: '/payouts/statistics', BANK_ACCOUNTS: '/payouts/bank-accounts' } as const;

export const DEFAULT_PAGE_SIZE = 20;

export const PAYOUT_STATUS_OPTIONS = [
  { key: '', label: 'All Statuses' },
  { key: 'pending', label: 'Pending' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'processing', label: 'Processing' },
  { key: 'sent', label: 'Sent' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'failed', label: 'Failed' },
  { key: 'cancelled', label: 'Cancelled' },
] as const;

export const PAYOUT_TYPE_OPTIONS = [
  { key: '', label: 'All Types' },
  { key: 'manual', label: 'Manual' },
  { key: 'scheduled', label: 'Scheduled' },
] as const;

export const PAYOUT_METHOD_OPTIONS = [
  { key: '', label: 'All Methods' },
  { key: 'bank_transfer', label: 'Bank Transfer' },
  { key: 'instant', label: 'Instant' },
  { key: 'manual', label: 'Manual' },
] as const;
