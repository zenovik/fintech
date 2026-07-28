export const INVOICES_API = { BASE: '/invoices', STATISTICS: '/invoices/statistics' } as const;
export const DEFAULT_PAGE_SIZE = 20;

export const INVOICE_STATUS_OPTIONS = [
  { key: '', label: 'All Statuses' },
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'viewed', label: 'Viewed' },
  { key: 'partially_paid', label: 'Partially Paid' },
  { key: 'paid', label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'voided', label: 'Voided' },
] as const;

export const CURRENCY_OPTIONS = [
  { key: 'USD', label: 'USD' },
  { key: 'EUR', label: 'EUR' },
  { key: 'GBP', label: 'GBP' },
] as const;
