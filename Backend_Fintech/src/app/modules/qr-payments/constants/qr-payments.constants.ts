export const QR_TYPES = ['static', 'dynamic', 'merchant', 'customer', 'outlet', 'table', 'multi'] as const;
export type QrType = (typeof QR_TYPES)[number];
export const QR_STATUSES = ['active', 'disabled'] as const;
export type QrStatus = (typeof QR_STATUSES)[number];
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;
