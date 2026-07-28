export const PAYOUT_STATUSES = [
  'pending',
  'scheduled',
  'processing',
  'sent',
  'confirmed',
  'failed',
  'cancelled',
] as const;

export const PAYOUT_TYPES = ['manual', 'scheduled'] as const;
export const PAYOUT_METHODS = ['bank_transfer', 'instant', 'manual'] as const;

export const PAYOUT_DEFAULT_PAGE_SIZE = 10;
export const PAYOUT_MAX_PAGE_SIZE = 50;

export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];
export type PayoutType = (typeof PAYOUT_TYPES)[number];
export type PayoutMethod = (typeof PAYOUT_METHODS)[number];
