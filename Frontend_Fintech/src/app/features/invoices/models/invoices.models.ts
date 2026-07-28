export interface ApiResponse<T> { success: boolean; data?: T; message?: string; }

export interface InvoiceLineItem {
  id?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  tax: number;
  discount: number;
  lineTotal: number;
}

export interface InvoiceStats {
  total: number;
  draft: number;
  sent: number;
  viewed: number;
  partiallyPaid: number;
  paid: number;
  overdue: number;
  cancelled: number;
  voided: number;
  outstandingAmount: number;
  paidAmount: number;
  overdueAmount: number;
  collectionRate: number;
}

export interface InvoiceSummary {
  id: number;
  invoiceNumber: string;
  referenceNumber: string | null;
  merchantId: number;
  merchantName: string | null;
  customerId: number;
  customerName: string | null;
  issueDate: string;
  dueDate: string;
  currency: string;
  status: string;
  total: number;
  amountPaid: number;
  balanceDue: number;
  createdAt: string;
}

export interface InvoicePayment {
  id: number;
  transactionId: number | null;
  transactionRef: string | null;
  amount: number;
  paymentMethod: string | null;
  createdAt: string;
}

export interface InvoiceDetail extends InvoiceSummary {
  organizationId: number;
  organizationName: string | null;
  customerEmail: string | null;
  notes: string | null;
  internalNotes: string | null;
  taxAmount: number;
  discountAmount: number;
  subtotal: number;
  sentAt: string | null;
  viewedAt: string | null;
  paidAt: string | null;
  paymentLink: { id: number; linkRef: string | null; publicUrl: string | null; status: string | null } | null;
  lineItems: InvoiceLineItem[];
  payments: InvoicePayment[];
  createdByName: string | null;
  updatedAt: string;
}

export interface InvoiceListResponse {
  items: InvoiceSummary[];
  stats: InvoiceStats;
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface CreateInvoicePayload {
  merchantId: number;
  customerId: number;
  referenceNumber?: string;
  issueDate: string;
  dueDate: string;
  currency?: string;
  notes?: string;
  internalNotes?: string;
  taxAmount?: number;
  discountAmount?: number;
  lineItems: Array<{ description: string; quantity: number; unitPrice: number; tax?: number; discount?: number }>;
  generatePaymentLink?: boolean;
}

export type UpdateInvoicePayload = Partial<CreateInvoicePayload>;
