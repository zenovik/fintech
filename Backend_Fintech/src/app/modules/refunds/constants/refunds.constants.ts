export const REFUND_STATUSES = ['pending', 'approved', 'rejected', 'processed', 'failed', 'cancelled'] as const;
export const REFUND_TYPES = ['full', 'partial'] as const;
export const REFUND_DEFAULT_PAGE_SIZE = 10;
export const REFUND_MAX_PAGE_SIZE = 50;

export type RefundStatus = (typeof REFUND_STATUSES)[number];
export type RefundType = (typeof REFUND_TYPES)[number];
