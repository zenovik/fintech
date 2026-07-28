export const SETTLEMENT_STATUSES = ['pending', 'processing', 'processed', 'failed', 'reversed'] as const;
export const BATCH_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const;
export const SETTLEMENT_CYCLES = ['daily', 'weekly', 'monthly'] as const;
export const SETTLEMENT_EXPORT_FORMATS = ['csv', 'xlsx', 'pdf'] as const;
export const SETTLEMENT_DEFAULT_PAGE_SIZE = 10;
export const SETTLEMENT_MAX_PAGE_SIZE = 50;

export type SettlementStatus = (typeof SETTLEMENT_STATUSES)[number];
export type BatchStatus = (typeof BATCH_STATUSES)[number];

export const PERIOD_DAYS = { daily: 1, weekly: 7, monthly: 30 } as const;
