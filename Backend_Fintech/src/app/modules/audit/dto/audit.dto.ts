import { z } from 'zod';
import { AUDIT_MODULES, AUDIT_RISK_LEVELS } from '../constants/audit.constants';

export const auditListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().max(200).optional(),
  module: z.enum(AUDIT_MODULES).optional(),
  categoryCode: z.string().max(64).optional(),
  actionCode: z.string().max(64).optional(),
  userId: z.coerce.number().int().min(1).optional(),
  entityType: z.string().max(64).optional(),
  entityId: z.string().max(100).optional(),
  riskLevel: z.enum(AUDIT_RISK_LEVELS).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  dateRange: z.enum(['24h', '7d', '30d', 'all']).optional(),
  sortBy: z.enum(['created_at', 'risk_level', 'module']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const auditIdParamSchema = z.object({
  id: z.coerce.number().int().min(1),
});

export const auditExportQuerySchema = auditListQuerySchema.omit({ page: true, pageSize: true });

export const apiLogListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().max(200).optional(),
  method: z.string().max(10).optional(),
  statusCode: z.coerce.number().int().optional(),
  userId: z.coerce.number().int().min(1).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  dateRange: z.enum(['24h', '7d', '30d', 'all']).optional(),
});

export const webhookLogListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().max(200).optional(),
  eventType: z.string().max(128).optional(),
  status: z.enum(['pending', 'success', 'failed', 'retrying']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  dateRange: z.enum(['24h', '7d', '30d', 'all']).optional(),
});

export type AuditListQueryDto = z.infer<typeof auditListQuerySchema>;
export type AuditIdParamDto = z.infer<typeof auditIdParamSchema>;
export type AuditExportQueryDto = z.infer<typeof auditExportQuerySchema>;
export type ApiLogListQueryDto = z.infer<typeof apiLogListQuerySchema>;
export type WebhookLogListQueryDto = z.infer<typeof webhookLogListQuerySchema>;
