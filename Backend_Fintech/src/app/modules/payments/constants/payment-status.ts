export type PaymentIntentStatus =
  | 'pending'
  | 'processing'
  | 'authorized'
  | 'captured'
  | 'settled'
  | 'failed'
  | 'expired'
  | 'refunded'
  | 'partially_refunded'
  | 'chargeback'
  | 'cancelled';

export type PaymentOrderStatus =
  | 'draft'
  | 'pending'
  | 'paid'
  | 'partial_paid'
  | 'expired'
  | 'cancelled'
  | 'refunded';

export type PaymentSessionStatus = 'open' | 'complete' | 'expired' | 'cancelled';

export const PAYMENT_STATUS_TRANSITIONS: Record<PaymentIntentStatus, PaymentIntentStatus[]> = {
  pending: ['processing', 'authorized', 'failed', 'expired', 'cancelled'],
  processing: ['authorized', 'failed', 'cancelled'],
  authorized: ['captured', 'cancelled', 'failed', 'expired'],
  captured: ['settled', 'refunded', 'partially_refunded', 'chargeback'],
  settled: ['refunded', 'partially_refunded', 'chargeback'],
  failed: [],
  expired: [],
  refunded: [],
  partially_refunded: ['refunded', 'chargeback'],
  chargeback: [],
  cancelled: [],
};

export const WEBHOOK_EVENTS = [
  'payment.created',
  'payment.authorized',
  'payment.captured',
  'payment.failed',
  'payment.refunded',
  'payment.settled',
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENTS)[number];

export function canTransition(from: PaymentIntentStatus, to: PaymentIntentStatus): boolean {
  return PAYMENT_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
