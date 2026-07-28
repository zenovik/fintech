export const CHARGEBACKS_API = { BASE: '/chargebacks', STATISTICS: '/chargebacks/statistics' } as const;

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50];

export const CHARGEBACK_STATUS_OPTIONS = [
  { key: '', label: 'All Statuses' },
  { key: 'open', label: 'Open' },
  { key: 'evidence_required', label: 'Evidence Required' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'representment_submitted', label: 'Representment Submitted' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
  { key: 'closed', label: 'Closed' },
] as const;

export const CHARGEBACK_REASON_OPTIONS = [
  { key: '', label: 'All Reasons' },
  { key: 'fraud', label: 'Fraud' },
  { key: 'product_not_received', label: 'Product Not Received' },
  { key: 'duplicate', label: 'Duplicate' },
  { key: 'subscription_cancelled', label: 'Subscription Cancelled' },
  { key: 'other', label: 'Other' },
] as const;

export const CHARGEBACK_NETWORK_OPTIONS = [
  { key: '', label: 'All Networks' },
  { key: 'visa', label: 'Visa' },
  { key: 'mastercard', label: 'Mastercard' },
  { key: 'amex', label: 'Amex' },
  { key: 'discover', label: 'Discover' },
  { key: 'other', label: 'Other' },
] as const;

export const RESOLUTION_OPTIONS = [
  { key: 'won', label: 'Won (Merchant)' },
  { key: 'lost', label: 'Lost (Cardholder)' },
] as const;
