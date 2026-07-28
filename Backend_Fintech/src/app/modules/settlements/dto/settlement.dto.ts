import { z } from 'zod';
import {
  BATCH_STATUSES,
  SETTLEMENT_CYCLES,
  SETTLEMENT_EXPORT_FORMATS,
  SETTLEMENT_STATUSES,
} from '../constants/settlement.constants';

const optionalBooleanQuery = z
  .union([z.boolean(), z.literal('true'), z.literal('false'), z.literal('1'), z.literal('0')])
  .optional()
  .transform((v) => v === true || v === 'true' || v === '1');

export const settlementListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
  search: z.string().max(100).optional(),
  status: z.enum(SETTLEMENT_STATUSES).optional(),
  merchantId: z.coerce.number().int().min(1).optional(),
  batchId: z.coerce.number().int().min(1).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  minAmount: z.coerce.number().min(0).optional(),
  maxAmount: z.coerce.number().min(0).optional(),
  sortBy: z.enum(['processed_at', 'amount', 'settlement_ref', 'created_at']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const settlementSearchQuerySchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const createSettlementBodySchema = z.object({
  merchantId: z.number().int().min(1),
  grossAmount: z.number().positive(),
  feeAmount: z.number().min(0).optional().default(0),
  adjustmentAmount: z.number().optional().default(0),
  currency: z.string().length(3).optional().default('USD'),
  settlementCycle: z.enum(SETTLEMENT_CYCLES).optional(),
  batchId: z.number().int().min(1).optional(),
  transactionIds: z.array(z.number().int().min(1)).optional(),
});

export const updateSettlementStatusBodySchema = z.object({
  status: z.enum(SETTLEMENT_STATUSES),
  reason: z.string().max(500).optional(),
});

export const reversalBodySchema = z.object({
  amount: z.number().positive(),
  reason: z.string().min(1).max(500),
});

export const createBatchBodySchema = z.object({
  settlementIds: z.array(z.number().int().min(1)).min(1),
  scheduledAt: z.string().optional(),
});

export const exportQuerySchema = z.object({
  format: z.enum(SETTLEMENT_EXPORT_FORMATS).optional().default('csv'),
  status: z.enum(SETTLEMENT_STATUSES).optional(),
  merchantId: z.coerce.number().int().min(1).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const settlementIdParamSchema = z.object({
  id: z.coerce.number().int().min(1),
});

export const batchIdParamSchema = z.object({
  id: z.coerce.number().int().min(1),
});

export type SettlementListQueryDto = z.infer<typeof settlementListQuerySchema>;
export type SettlementSearchQueryDto = z.infer<typeof settlementSearchQuerySchema>;
export type CreateSettlementBodyDto = z.infer<typeof createSettlementBodySchema>;
export type UpdateSettlementStatusBodyDto = z.infer<typeof updateSettlementStatusBodySchema>;
export type ReversalBodyDto = z.infer<typeof reversalBodySchema>;
export type CreateBatchBodyDto = z.infer<typeof createBatchBodySchema>;
export type ExportQueryDto = z.infer<typeof exportQuerySchema>;
