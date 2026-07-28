export const PAYMENT_LINKS_API = {
  BASE: '/payment-links',
  STATISTICS: '/payment-links/statistics',
  PUBLIC: '/public/payment-links',
} as const;

export const DEFAULT_PAGE_SIZE = 20;

export const PAYMENT_LINK_STATUS_OPTIONS = [
  { key: '', label: 'All Statuses' },
  { key: 'active', label: 'Active' },
  { key: 'disabled', label: 'Disabled' },
  { key: 'expired', label: 'Expired' },
] as const;

export const CURRENCY_OPTIONS = [
  { key: 'USD', label: 'USD' },
  { key: 'EUR', label: 'EUR' },
  { key: 'GBP', label: 'GBP' },
] as const;
