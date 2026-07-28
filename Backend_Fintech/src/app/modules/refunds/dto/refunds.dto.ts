import { z } from 'zod';
import { REFUND_STATUSES, REFUND_TYPES } from '../constants/refunds.constants';

export const refundListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
  search: z.string().max(100).optional(),
  status: z.enum(REFUND_STATUSES).optional(),
  refundType: z.enum(REFUND_TYPES).optional(),
  merchantId: z.coerce.number().int().min(1).optional(),
  customerId: z.coerce.number().int().min(1).optional(),
  transactionId: z.coerce.number().int().min(1).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(['created_at', 'amount', 'status', 'processed_at']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const createRefundBodySchema = z.object({
  transactionId: z.number().int().min(1),
  amount: z.number().positive(),
  reason: z.string().max(500).optional(),
});

export const rejectRefundBodySchema = z.object({
  reason: z.string().min(1).max(500),
});

export const refundIdParamSchema = z.object({
  id: z.coerce.number().int().min(1),
});

export type RefundListQueryDto = z.infer<typeof refundListQuerySchema>;
export type CreateRefundBodyDto = z.infer<typeof createRefundBodySchema>;
export type RejectRefundBodyDto = z.infer<typeof rejectRefundBodySchema>;
