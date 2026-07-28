import { z } from 'zod';
import { INVOICE_STATUSES } from '../constants/invoices.constants';

export const lineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  tax: z.number().min(0).optional().default(0),
  discount: z.number().min(0).optional().default(0),
});

export const invoiceListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
  search: z.string().max(100).optional(),
  status: z.enum(INVOICE_STATUSES).optional(),
  merchantId: z.coerce.number().int().min(1).optional(),
  customerId: z.coerce.number().int().min(1).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(['created_at', 'issue_date', 'due_date', 'total', 'status', 'invoice_number']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const createInvoiceBodySchema = z.object({
  merchantId: z.number().int().min(1),
  customerId: z.number().int().min(1),
  referenceNumber: z.string().max(50).optional(),
  issueDate: z.string(),
  dueDate: z.string(),
  currency: z.string().length(3).optional().default('USD'),
  notes: z.string().max(5000).optional(),
  internalNotes: z.string().max(5000).optional(),
  taxAmount: z.number().min(0).optional().default(0),
  discountAmount: z.number().min(0).optional().default(0),
  lineItems: z.array(lineItemSchema).min(1),
  generatePaymentLink: z.boolean().optional().default(false),
});

export const updateInvoiceBodySchema = z.object({
  merchantId: z.number().int().min(1).optional(),
  customerId: z.number().int().min(1).optional(),
  referenceNumber: z.string().max(50).optional(),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  currency: z.string().length(3).optional(),
  notes: z.string().max(5000).optional(),
  internalNotes: z.string().max(5000).optional(),
  taxAmount: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional(),
  lineItems: z.array(lineItemSchema).min(1).optional(),
});

export const invoiceIdParamSchema = z.object({
  id: z.coerce.number().int().min(1),
});

export const emailInvoiceBodySchema = z.object({
  recipientEmail: z.string().email().optional(),
  message: z.string().max(2000).optional(),
});

export const markPaidBodySchema = z.object({
  amount: z.number().positive().optional(),
  notes: z.string().max(255).optional(),
});

export type InvoiceListQueryDto = z.infer<typeof invoiceListQuerySchema>;
export type CreateInvoiceBodyDto = z.infer<typeof createInvoiceBodySchema>;
export type UpdateInvoiceBodyDto = z.infer<typeof updateInvoiceBodySchema>;
export type EmailInvoiceBodyDto = z.infer<typeof emailInvoiceBodySchema>;
export type MarkPaidBodyDto = z.infer<typeof markPaidBodySchema>;
