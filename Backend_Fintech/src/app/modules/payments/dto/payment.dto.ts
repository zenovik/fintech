import { z } from 'zod';

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
export const merchantIdParamSchema = z.object({ merchantId: z.coerce.number().int().positive() });
export const customerIdParamSchema = z.object({ customerId: z.coerce.number().int().positive() });

export const paymentListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  status: z.string().optional(),
  merchantId: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
});

export const createPaymentBodySchema = z.object({
  merchantId: z.number().int().positive(),
  amount: z.number().positive(),
  currency: z.string().length(3).optional(),
  customerId: z.number().int().positive().optional(),
  merchantOrderId: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  paymentMethodTypeId: z.number().int().positive().optional(),
  paymentMethodCode: z.string().max(30).optional(),
  createOrder: z.boolean().optional(),
  createSession: z.boolean().optional(),
  autoAuthorize: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const captureBodySchema = z.object({ amount: z.number().positive().optional() });
export const cancelBodySchema = z.object({ reason: z.string().max(500).optional() });
export const refundBodySchema = z.object({
  amount: z.number().positive().optional(),
  reason: z.string().max(500).optional(),
});

export const createSessionBodySchema = z.object({
  merchantId: z.number().int().positive(),
  amount: z.number().positive(),
  currency: z.string().length(3).optional(),
  customerId: z.number().int().positive().optional(),
  orderId: z.number().int().positive().optional(),
  paymentIntentId: z.number().int().positive().optional(),
});
