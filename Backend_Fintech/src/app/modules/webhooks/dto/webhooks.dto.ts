import { z } from 'zod';

const urlSchema = z.string().trim().url('Invalid webhook URL').max(2048);
const eventTypesSchema = z.array(z.string().trim().min(1).max(128)).max(100);

export const createWebhookSchema = z.object({
  merchantId: z.coerce.number().int().min(1),
  url: urlSchema,
  description: z.string().trim().max(500).optional().nullable(),
  eventTypes: eventTypesSchema.optional().default([]),
});

export const updateWebhookSchema = z.object({
  url: urlSchema,
  description: z.string().trim().max(500).optional().nullable(),
  eventTypes: eventTypesSchema.optional().default([]),
  isActive: z.coerce.boolean().optional(),
});

export const createSubscriptionSchema = z.object({
  eventCategory: z.string().trim().min(1).max(64),
  eventType: z.string().trim().min(1).max(128),
  isEnabled: z.coerce.boolean().optional().default(true),
});

export const updateSubscriptionSchema = z.object({
  eventCategory: z.string().trim().min(1).max(64),
  eventType: z.string().trim().min(1).max(128),
  isEnabled: z.coerce.boolean().optional(),
});

export const retryDeliverySchema = z.object({
  reason: z.string().trim().max(500).optional(),
});
