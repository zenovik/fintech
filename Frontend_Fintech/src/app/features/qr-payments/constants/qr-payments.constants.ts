export const QR_PAYMENTS_API = {
  BASE: '/qr-payments',
  STATISTICS: '/qr-payments/statistics',
  PUBLIC: '/public/qr-payments',
} as const;

export const DEFAULT_PAGE_SIZE = 20;

export const QR_STATUS_OPTIONS = [
  { key: '', label: 'All Statuses' },
  { key: 'active', label: 'Active' },
  { key: 'disabled', label: 'Disabled' },
] as const;

export const QR_TYPE_OPTIONS = [
  { key: '', label: 'All Types' },
  { key: 'static', label: 'Static' },
  { key: 'dynamic', label: 'Dynamic' },
  { key: 'merchant', label: 'Merchant' },
  { key: 'customer', label: 'Customer' },
] as const;

export const QR_TYPE_CREATE_OPTIONS = [
  { key: 'static', label: 'Static' },
  { key: 'dynamic', label: 'Dynamic' },
  { key: 'merchant', label: 'Merchant' },
  { key: 'customer', label: 'Customer' },
] as const;

export const CURRENCY_OPTIONS = [
  { key: 'USD', label: 'USD' },
  { key: 'EUR', label: 'EUR' },
  { key: 'GBP', label: 'GBP' },
] as const;
