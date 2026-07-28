import { z } from 'zod';
import { PAYMENT_LINK_STATUSES } from '../constants/payment-links.constants';

export const paymentLinkListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
  search: z.string().max(100).optional(),
  status: z.enum(PAYMENT_LINK_STATUSES).optional(),
  merchantId: z.coerce.number().int().min(1).optional(),
  customerId: z.coerce.number().int().min(1).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(['created_at', 'amount', 'status', 'expires_at', 'current_usage']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const createPaymentLinkBodySchema = z.object({
  merchantId: z.number().int().min(1),
  customerId: z.number().int().min(1).optional(),
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().length(3).optional().default('USD'),
  allowCustomAmount: z.boolean().optional().default(false),
  expiresAt: z.string().optional(),
  maxUsage: z.number().int().min(1).optional(),
  redirectUrl: z.string().url().max(500).optional(),
  successUrl: z.string().url().max(500).optional(),
  cancelUrl: z.string().url().max(500).optional(),
}).refine((d) => d.allowCustomAmount || d.amount != null, {
  message: 'Amount is required unless custom amounts are allowed',
  path: ['amount'],
});

export const updatePaymentLinkBodySchema = z.object({
  merchantId: z.number().int().min(1).optional(),
  customerId: z.number().int().min(1).optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  allowCustomAmount: z.boolean().optional(),
  expiresAt: z.string().optional(),
  maxUsage: z.number().int().min(1).optional(),
  redirectUrl: z.string().url().max(500).optional(),
  successUrl: z.string().url().max(500).optional(),
  cancelUrl: z.string().url().max(500).optional(),
});

export const paymentLinkIdParamSchema = z.object({
  id: z.coerce.number().int().min(1),
});

export const publicTokenParamSchema = z.object({
  token: z.string().min(8).max(64),
});

export const publicPayBodySchema = z.object({
  amount: z.number().positive().optional(),
  customerName: z.string().max(255).optional(),
  customerEmail: z.string().email().max(255).optional(),
  paymentMethodDetail: z.string().min(1).max(100).optional().default('Payment Link'),
});

export type PaymentLinkListQueryDto = z.infer<typeof paymentLinkListQuerySchema>;
export type CreatePaymentLinkBodyDto = z.infer<typeof createPaymentLinkBodySchema>;
export type UpdatePaymentLinkBodyDto = z.infer<typeof updatePaymentLinkBodySchema>;
export type PublicPayBodyDto = z.infer<typeof publicPayBodySchema>;
