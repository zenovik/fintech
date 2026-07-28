import { z } from 'zod';

export const checkoutRefParamSchema = z.object({ ref: z.string().min(1).max(40) });
export const recoveryTokenParamSchema = z.object({ token: z.string().min(16).max(128) });
export const checkoutIdParamSchema = z.object({ id: z.coerce.number().int().positive() });
export const merchantIdParamSchema = z.object({ merchantId: z.coerce.number().int().positive() });

export const createCheckoutSessionBodySchema = z.object({
  merchantId: z.number().int().positive(),
  amount: z.number().positive(),
  currency: z.string().length(3).optional(),
  customerId: z.number().int().positive().optional(),
  merchantOrderId: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  paymentMethodCode: z.string().max(30).optional(),
  locale: z.string().max(10).optional(),
  themeId: z.number().int().positive().optional(),
  mode: z.enum(['hosted', 'embedded']).optional(),
  returnUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  successUrl: z.string().url().optional(),
  failureUrl: z.string().url().optional(),
  pendingUrl: z.string().url().optional(),
  webhookUrl: z.string().url().optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().max(20).optional(),
  expiryMinutes: z.number().int().min(5).max(1440).optional(),
  idempotencyKey: z.string().max(128).optional(),
});

export const checkoutPayBodySchema = z.object({
  paymentMethodCode: z.string().min(1).max(30),
  amount: z.number().positive().optional(),
});
