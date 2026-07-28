import { z } from 'zod';
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_STATUSES,
} from '../constants/notifications.constants';

export const notificationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
  search: z.string().max(100).optional(),
  status: z.enum(NOTIFICATION_STATUSES).optional(),
  category: z.enum(NOTIFICATION_CATEGORIES).optional(),
  categories: z.string().optional(),
  priority: z.enum(NOTIFICATION_PRIORITIES).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(['created_at', 'priority', 'title']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  organizationId: z.coerce.number().int().min(1).optional(),
});

export const notificationIdParamSchema = z.object({
  id: z.coerce.number().int().min(1),
});

export const templateListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
  search: z.string().max(100).optional(),
  eventCode: z.string().max(64).optional(),
  channel: z.enum(NOTIFICATION_CHANNELS).optional(),
  category: z.enum(NOTIFICATION_CATEGORIES).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const templateIdParamSchema = z.object({
  id: z.coerce.number().int().min(1),
});

export const createTemplateBodySchema = z.object({
  code: z.string().min(1).max(64).regex(/^[a-z0-9_]+$/),
  name: z.string().min(1).max(150),
  eventCode: z.string().min(1).max(64),
  channel: z.enum(NOTIFICATION_CHANNELS).optional().default('in_app'),
  subject: z.string().max(255).optional(),
  bodyTemplate: z.string().min(1).max(5000),
  category: z.enum(NOTIFICATION_CATEGORIES).optional().default('system'),
  isActive: z.boolean().optional().default(true),
});

export const updateTemplateBodySchema = createTemplateBodySchema.partial().omit({ code: true });

export const broadcastListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
  search: z.string().max(100).optional(),
});

export const createBroadcastBodySchema = z.object({
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(5000),
  groupCode: z.enum(['all_users', 'admins', 'operations']).optional().default('all_users'),
  priority: z.enum(NOTIFICATION_PRIORITIES).optional().default('normal'),
  category: z.enum(NOTIFICATION_CATEGORIES).optional().default('system'),
});

export const dispatchNotificationSchema = z.object({
  userId: z.number().int().min(1),
  eventCode: z.string().min(1).max(64),
  title: z.string().min(1).max(255).optional(),
  body: z.string().min(1).max(5000).optional(),
  category: z.enum(NOTIFICATION_CATEGORIES).optional(),
  priority: z.enum(NOTIFICATION_PRIORITIES).optional().default('normal'),
  icon: z.string().max(64).optional(),
  actionUrl: z.string().max(512).optional(),
  actionLabel: z.string().max(100).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  broadcastId: z.string().uuid().optional(),
  relatedEntityType: z.string().max(64).optional(),
  relatedEntityId: z.number().int().optional(),
});

export type NotificationListQueryDto = z.infer<typeof notificationListQuerySchema>;
export type NotificationIdParamDto = z.infer<typeof notificationIdParamSchema>;
export type TemplateListQueryDto = z.infer<typeof templateListQuerySchema>;
export type TemplateIdParamDto = z.infer<typeof templateIdParamSchema>;
export type CreateTemplateBodyDto = z.infer<typeof createTemplateBodySchema>;
export type UpdateTemplateBodyDto = z.infer<typeof updateTemplateBodySchema>;
export type BroadcastListQueryDto = z.infer<typeof broadcastListQuerySchema>;
export type CreateBroadcastBodyDto = z.infer<typeof createBroadcastBodySchema>;
export type DispatchNotificationDto = z.infer<typeof dispatchNotificationSchema>;
