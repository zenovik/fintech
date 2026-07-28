export const INVOICE_STATUSES = [
  'draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'cancelled', 'voided',
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const EDITABLE_STATUSES: InvoiceStatus[] = ['draft'];
export const PAYABLE_STATUSES: InvoiceStatus[] = ['sent', 'viewed', 'partially_paid', 'overdue'];

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;
