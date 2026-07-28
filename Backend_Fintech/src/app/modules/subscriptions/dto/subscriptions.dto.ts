import { z } from 'zod';
import { BILLING_INTERVALS, SUBSCRIPTION_STATUSES } from '../constants/subscriptions.constants';

export const planListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
  search: z.string().max(100).optional(),
  merchantId: z.coerce.number().int().min(1).optional(),
});

export const createPlanBodySchema = z.object({
  merchantId: z.number().int().min(1),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  price: z.number().positive(),
  currency: z.string().length(3).optional().default('USD'),
  billingInterval: z.enum(BILLING_INTERVALS).optional().default('monthly'),
  trialDays: z.number().int().min(0).optional().default(0),
});

export const subscriptionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
  search: z.string().max(100).optional(),
  status: z.enum(SUBSCRIPTION_STATUSES).optional(),
  merchantId: z.coerce.number().int().min(1).optional(),
  customerId: z.coerce.number().int().min(1).optional(),
});

export const createSubscriptionBodySchema = z.object({
  merchantId: z.number().int().min(1),
  customerId: z.number().int().min(1),
  planId: z.number().int().min(1),
  startDate: z.string().optional(),
});

export const idParamSchema = z.object({ id: z.coerce.number().int().min(1) });

export type PlanListQueryDto = z.infer<typeof planListQuerySchema>;
export type CreatePlanBodyDto = z.infer<typeof createPlanBodySchema>;
export type SubscriptionListQueryDto = z.infer<typeof subscriptionListQuerySchema>;
export type CreateSubscriptionBodyDto = z.infer<typeof createSubscriptionBodySchema>;
