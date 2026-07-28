import { z } from 'zod';
import {
  DISPUTE_STATUSES,
  TRANSACTION_EXPORT_FORMATS,
  TRANSACTION_PERIODS,
} from '../constants/transaction.constants';

const optionalBooleanQuery = z
  .union([z.boolean(), z.literal('true'), z.literal('false'), z.literal('1'), z.literal('0')])
  .optional()
  .transform((v) => v === true || v === 'true' || v === '1');

export const transactionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
  search: z.string().max(100).optional(),
  status: z.string().max(20).optional(),
  merchantId: z.coerce.number().int().min(1).optional(),
  regionId: z.coerce.number().int().min(1).optional(),
  paymentMethod: z.string().max(30).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  minAmount: z.coerce.number().min(0).optional(),
  maxAmount: z.coerce.number().min(0).optional(),
  isHighValue: optionalBooleanQuery,
  period: z.enum(TRANSACTION_PERIODS).optional(),
  sortBy: z.enum(['processed_at', 'amount', 'transaction_ref']).optional().default('processed_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const transactionSearchQuerySchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const createTransactionBodySchema = z.object({
  merchantId: z.number().int().min(1),
  amount: z.number().positive(),
  currency: z.string().length(3).optional().default('USD'),
  paymentMethodTypeId: z.number().int().min(1),
  paymentMethodDetail: z.string().min(1).max(100),
  customerName: z.string().max(255).optional(),
  customerEmail: z.string().email().max(255).optional(),
  description: z.string().max(1000).optional(),
  regionId: z.number().int().min(1).optional(),
});

export const updateTransactionStatusBodySchema = z.object({
  statusCode: z.enum(['settled', 'pending', 'failed', 'flagged']),
  reason: z.string().max(500).optional(),
});

export const refundTransactionBodySchema = z.object({
  amount: z.number().positive(),
  reason: z.string().max(500).optional(),
});

export const createDisputeBodySchema = z.object({
  transactionId: z.number().int().min(1),
  reason: z.string().min(1).max(500),
  amount: z.number().positive().optional(),
});

export const exportQuerySchema = z.object({
  format: z.enum(TRANSACTION_EXPORT_FORMATS).optional().default('csv'),
  status: z.string().max(20).optional(),
  merchantId: z.coerce.number().int().min(1).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  isHighValue: optionalBooleanQuery,
});

export const transactionIdParamSchema = z.object({
  id: z.coerce.number().int().min(1),
});

export type TransactionListQueryDto = z.infer<typeof transactionListQuerySchema>;
export type TransactionSearchQueryDto = z.infer<typeof transactionSearchQuerySchema>;
export type CreateTransactionBodyDto = z.infer<typeof createTransactionBodySchema>;
export type UpdateTransactionStatusBodyDto = z.infer<typeof updateTransactionStatusBodySchema>;
export type RefundTransactionBodyDto = z.infer<typeof refundTransactionBodySchema>;
export type CreateDisputeBodyDto = z.infer<typeof createDisputeBodySchema>;
export type ExportQueryDto = z.infer<typeof exportQuerySchema>;
