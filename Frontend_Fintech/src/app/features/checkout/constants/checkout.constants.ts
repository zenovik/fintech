export const CHECKOUT_API = {
  BASE: '/checkout',
  PUBLIC: '/public/checkout',
} as const;

export const DEFAULT_PAGE_SIZE = 25;

export const CHECKOUT_STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'complete', label: 'Complete' },
  { value: 'pending', label: 'Pending' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'abandoned', label: 'Abandoned' },
];

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  upi: 'UPI',
  card: 'Credit / Debit Card',
  netbanking: 'Net Banking',
  wallet: 'Wallet',
  emi: 'EMI',
  bnpl: 'Buy Now Pay Later',
  qr: 'QR Code',
  tap_to_pay: 'Tap To Pay',
  softpos: 'SoftPOS',
  saved_card: 'Saved Card',
  saved_upi: 'Saved UPI',
};

export const PAYMENT_METHOD_ICONS: Record<string, string> = {
  upi: 'account_balance_wallet',
  card: 'credit_card',
  netbanking: 'account_balance',
  wallet: 'wallet',
  emi: 'calendar_month',
  bnpl: 'schedule',
  qr: 'qr_code_2',
  tap_to_pay: 'contactless',
  softpos: 'point_of_sale',
  saved_card: 'credit_score',
  saved_upi: 'payments',
};
