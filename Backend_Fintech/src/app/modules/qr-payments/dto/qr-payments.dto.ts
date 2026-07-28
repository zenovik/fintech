import { z } from 'zod';
import { QR_STATUSES, QR_TYPES } from '../constants/qr-payments.constants';

export const qrListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
  search: z.string().max(100).optional(),
  status: z.enum(QR_STATUSES).optional(),
  qrType: z.enum(QR_TYPES).optional(),
  merchantId: z.coerce.number().int().min(1).optional(),
  customerId: z.coerce.number().int().min(1).optional(),
  sortBy: z.enum(['created_at', 'scan_count', 'amount', 'status']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const createQrBodySchema = z.object({
  merchantId: z.number().int().min(1),
  customerId: z.number().int().min(1).optional(),
  outletId: z.number().int().min(1).optional(),
  tableLabel: z.string().max(50).optional(),
  parentQrId: z.number().int().min(1).optional(),
  qrType: z.enum(QR_TYPES).optional().default('static'),
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().length(3).optional().default('USD'),
  allowCustomAmount: z.boolean().optional().default(false),
  expiresAt: z.string().optional(),
}).refine((d) => d.allowCustomAmount || d.amount != null || ['dynamic', 'merchant', 'outlet', 'table', 'multi'].includes(d.qrType ?? 'static'), {
  message: 'Amount is required unless custom amounts are allowed',
  path: ['amount'],
});

export const updateQrBodySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  allowCustomAmount: z.boolean().optional(),
  expiresAt: z.string().optional(),
});

export const qrIdParamSchema = z.object({ id: z.coerce.number().int().min(1) });
export const publicTokenParamSchema = z.object({ token: z.string().min(8).max(64) });
export const publicQrPayBodySchema = z.object({
  amount: z.number().positive().optional(),
  customerName: z.string().max(255).optional(),
  customerEmail: z.string().email().max(255).optional(),
  paymentMethodDetail: z.string().min(1).max(100).optional().default('QR Payment'),
});

export type QrListQueryDto = z.infer<typeof qrListQuerySchema>;
export type CreateQrBodyDto = z.infer<typeof createQrBodySchema>;
export type UpdateQrBodyDto = z.infer<typeof updateQrBodySchema>;
export type PublicQrPayBodyDto = z.infer<typeof publicQrPayBodySchema>;
