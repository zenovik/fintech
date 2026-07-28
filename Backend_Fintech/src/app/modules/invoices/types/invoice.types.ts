import { RowDataPacket } from 'mysql2/promise';
import { InvoiceStatus } from '../constants/invoices.constants';

export interface InvoiceRow extends RowDataPacket {
  id: number;
  uuid: string;
  organization_id: number;
  merchant_id: number;
  customer_id: number;
  payment_link_id: number | null;
  invoice_number: string;
  reference_number: string | null;
  issue_date: string;
  due_date: string;
  currency: string;
  status: InvoiceStatus;
  notes: string | null;
  internal_notes: string | null;
  tax_amount: string;
  discount_amount: string;
  subtotal: string;
  total: string;
  amount_paid: string;
  balance_due: string;
  sent_at: string | null;
  viewed_at: string | null;
  paid_at: string | null;
  created_by: number | null;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
  organization_name?: string;
  organization_code?: string;
  merchant_name?: string;
  merchant_code?: string;
  customer_name?: string;
  customer_email?: string;
  created_by_name?: string;
  updated_by_name?: string;
  payment_link_ref?: string;
  payment_link_token?: string;
  payment_link_status?: string;
}

export interface InvoiceLineItemRow extends RowDataPacket {
  id: number;
  invoice_id: number;
  sort_order: number;
  description: string;
  quantity: string;
  unit_price: string;
  tax_amount: string;
  discount_amount: string;
  line_total: string;
}

export interface InvoicePaymentRow extends RowDataPacket {
  id: number;
  invoice_id: number;
  transaction_id: number | null;
  payment_link_id: number | null;
  amount: string;
  payment_method: string | null;
  notes: string | null;
  created_by: number | null;
  created_at: string;
  transaction_ref?: string;
  created_by_name?: string;
}

export interface InvoiceStatisticsRow extends RowDataPacket {
  total: number;
  draft_count: number;
  sent_count: number;
  viewed_count: number;
  partially_paid_count: number;
  paid_count: number;
  overdue_count: number;
  cancelled_count: number;
  voided_count: number;
  outstanding_amount: string;
  paid_amount: string;
  overdue_amount: string;
  collection_rate: string;
}

export interface InvoiceLineItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  tax?: number;
  discount?: number;
}

export interface InvoiceTotals {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  lineItems: Array<InvoiceLineItemInput & { lineTotal: number }>;
}
