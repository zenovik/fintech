export const TRANSACTION_PERIODS = ['daily', 'weekly', 'monthly'] as const;
export const TRANSACTION_EXPORT_FORMATS = ['csv', 'xlsx', 'pdf'] as const;
export const DISPUTE_STATUSES = ['open', 'under_review', 'won', 'lost', 'closed'] as const;
export const REFUND_STATUSES = ['pending', 'processed', 'failed'] as const;
export const TRANSACTION_DEFAULT_PAGE_SIZE = 10;
export const TRANSACTION_MAX_PAGE_SIZE = 50;
export const HIGH_VALUE_THRESHOLD_DEFAULT = 50000;

export type TransactionPeriod = (typeof TRANSACTION_PERIODS)[number];
export type TransactionExportFormat = (typeof TRANSACTION_EXPORT_FORMATS)[number];
export type DisputeStatus = (typeof DISPUTE_STATUSES)[number];

export const PERIOD_DAYS: Record<TransactionPeriod, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};
