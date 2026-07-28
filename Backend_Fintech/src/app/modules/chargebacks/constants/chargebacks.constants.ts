export const CHARGEBACK_STATUSES = [
  'open',
  'evidence_required',
  'under_review',
  'representment_submitted',
  'won',
  'lost',
  'closed',
] as const;

export const CHARGEBACK_REASON_CODES = [
  'fraud',
  'product_not_received',
  'duplicate',
  'subscription_cancelled',
  'other',
] as const;

export const CHARGEBACK_CARD_NETWORKS = ['visa', 'mastercard', 'amex', 'discover', 'other'] as const;

export const CHARGEBACK_RESOLUTION_OUTCOMES = ['won', 'lost', 'merchant_won', 'merchant_lost'] as const;

export const CHARGEBACK_DEFAULT_PAGE_SIZE = 10;
export const CHARGEBACK_MAX_PAGE_SIZE = 50;

export type ChargebackStatus = (typeof CHARGEBACK_STATUSES)[number];
export type ChargebackReasonCode = (typeof CHARGEBACK_REASON_CODES)[number];
export type ChargebackCardNetwork = (typeof CHARGEBACK_CARD_NETWORKS)[number];
