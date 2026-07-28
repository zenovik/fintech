export const PAYMENT_LINK_STATUSES = ['active', 'disabled', 'expired'] as const;
export type PaymentLinkStatus = (typeof PAYMENT_LINK_STATUSES)[number];

export const DEFAULT_PAGE_SIZE = 10;
