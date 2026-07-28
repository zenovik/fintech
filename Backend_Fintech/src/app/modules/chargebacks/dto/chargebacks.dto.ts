import { z } from 'zod';
import {
  CHARGEBACK_CARD_NETWORKS,
  CHARGEBACK_REASON_CODES,
  CHARGEBACK_RESOLUTION_OUTCOMES,
  CHARGEBACK_STATUSES,
} from '../constants/chargebacks.constants';

export const chargebackListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
  search: z.string().max(100).optional(),
  status: z.enum(CHARGEBACK_STATUSES).optional(),
  reasonCode: z.enum(CHARGEBACK_REASON_CODES).optional(),
  cardNetwork: z.enum(CHARGEBACK_CARD_NETWORKS).optional(),
  merchantId: z.coerce.number().int().min(1).optional(),
  customerId: z.coerce.number().int().min(1).optional(),
  transactionId: z.coerce.number().int().min(1).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(['created_at', 'amount', 'status', 'evidence_due_at', 'resolved_at']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const createChargebackBodySchema = z.object({
  transactionId: z.number().int().min(1),
  reason: z.string().min(1).max(500),
  reasonCode: z.enum(CHARGEBACK_REASON_CODES).optional().default('other'),
  cardNetwork: z.enum(CHARGEBACK_CARD_NETWORKS).optional().default('visa'),
  amount: z.number().positive().optional(),
  evidenceDueAt: z.string().optional(),
});

export const addEvidenceBodySchema = z.object({
  fileName: z.string().min(1).max(255),
  fileUrl: z.string().min(1).max(500),
  mimeType: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
});

export const representmentBodySchema = z.object({
  notes: z.string().min(1).max(2000),
});

export const resolveChargebackBodySchema = z.object({
  outcome: z.enum(CHARGEBACK_RESOLUTION_OUTCOMES),
  notes: z.string().max(500).optional(),
});

export const chargebackIdParamSchema = z.object({
  id: z.coerce.number().int().min(1),
});

export type ChargebackListQueryDto = z.infer<typeof chargebackListQuerySchema>;
export type CreateChargebackBodyDto = z.infer<typeof createChargebackBodySchema>;
export type AddEvidenceBodyDto = z.infer<typeof addEvidenceBodySchema>;
export type RepresentmentBodyDto = z.infer<typeof representmentBodySchema>;
export type ResolveChargebackBodyDto = z.infer<typeof resolveChargebackBodySchema>;
