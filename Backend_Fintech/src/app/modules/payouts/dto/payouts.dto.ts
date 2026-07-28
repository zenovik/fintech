import { z } from 'zod';
import { PAYOUT_METHODS, PAYOUT_STATUSES, PAYOUT_TYPES } from '../constants/payouts.constants';

export const payoutListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
  search: z.string().max(100).optional(),
  status: z.enum(PAYOUT_STATUSES).optional(),
  payoutType: z.enum(PAYOUT_TYPES).optional(),
  payoutMethod: z.enum(PAYOUT_METHODS).optional(),
  merchantId: z.coerce.number().int().min(1).optional(),
  settlementId: z.coerce.number().int().min(1).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(['created_at', 'amount', 'status', 'scheduled_at', 'confirmed_at']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const createPayoutBodySchema = z.object({
  merchantId: z.number().int().min(1),
  amount: z.number().positive(),
  bankAccountId: z.number().int().min(1).optional(),
  settlementId: z.number().int().min(1).optional(),
  payoutType: z.enum(PAYOUT_TYPES).optional().default('manual'),
  payoutMethod: z.enum(PAYOUT_METHODS).optional().default('bank_transfer'),
  scheduledAt: z.string().optional(),
  notes: z.string().max(500).optional(),
  feeAmount: z.number().min(0).optional(),
});

export const bankAccountListQuerySchema = z.object({
  merchantId: z.coerce.number().int().min(1).optional(),
});

export const createBankAccountBodySchema = z.object({
  merchantId: z.number().int().min(1),
  accountHolder: z.string().min(1).max(255),
  bankName: z.string().max(255).optional(),
  accountNumberMasked: z.string().min(4).max(30),
  iban: z.string().max(34).optional(),
  swiftBic: z.string().max(11).optional(),
  currency: z.string().length(3).optional().default('USD'),
  isPrimary: z.boolean().optional().default(false),
});

export const updateBankAccountBodySchema = z.object({
  isPrimary: z.boolean().optional(),
  bankName: z.string().max(255).optional(),
});

export const rejectPayoutBodySchema = z.object({
  reason: z.string().min(1).max(500),
});

export const payoutIdParamSchema = z.object({
  id: z.coerce.number().int().min(1),
});

export const bankAccountIdParamSchema = z.object({
  id: z.coerce.number().int().min(1),
});

export type PayoutListQueryDto = z.infer<typeof payoutListQuerySchema>;
export type CreatePayoutBodyDto = z.infer<typeof createPayoutBodySchema>;
export type BankAccountListQueryDto = z.infer<typeof bankAccountListQuerySchema>;
export type CreateBankAccountBodyDto = z.infer<typeof createBankAccountBodySchema>;
export type UpdateBankAccountBodyDto = z.infer<typeof updateBankAccountBodySchema>;
export type RejectPayoutBodyDto = z.infer<typeof rejectPayoutBodySchema>;
