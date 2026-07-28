import { z } from 'zod';
import { EXPORT_FORMATS, PERIOD_TYPES, REPORT_STATUSES } from '../constants/reports.constants';

export const reportListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(REPORT_STATUSES).optional(),
  categoryId: z.coerce.number().int().optional(),
  sortBy: z.enum(['name', 'created_at', 'status']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const createReportBodySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  templateId: z.number().int().optional(),
  categoryId: z.number().int().optional(),
  status: z.enum(REPORT_STATUSES).default('active'),
  filters: z.record(z.string(), z.unknown()).optional(),
});

export const updateReportBodySchema = createReportBodySchema.partial();

export const reportIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const runReportBodySchema = z.object({
  reportId: z.number().int().optional(),
  templateId: z.number().int().optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
});

export const exportReportBodySchema = z.object({
  reportId: z.number().int().optional(),
  format: z.enum(EXPORT_FORMATS).default('csv'),
  filters: z.record(z.string(), z.unknown()).optional(),
});

export const exportQuerySchema = z.object({
  format: z.enum(EXPORT_FORMATS).default('csv'),
  period: z.enum(PERIOD_TYPES).default('monthly'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  merchantId: z.coerce.number().int().optional(),
  status: z.string().optional(),
});

export const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export const createScheduledBodySchema = z.object({
  reportId: z.number().int(),
  name: z.string().min(1).max(200),
  cronExpression: z.string().min(1).max(100),
  format: z.enum(EXPORT_FORMATS).default('csv'),
  recipients: z.array(z.string().email()).optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().default(true),
});

export const updateScheduledBodySchema = createScheduledBodySchema.partial();

export const scheduledIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const analyticsQuerySchema = z.object({
  period: z.enum(PERIOD_TYPES).default('monthly'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  merchantId: z.coerce.number().int().optional(),
  status: z.string().optional(),
});

export type ReportListQueryDto = z.infer<typeof reportListQuerySchema>;
export type CreateReportBodyDto = z.infer<typeof createReportBodySchema>;
export type UpdateReportBodyDto = z.infer<typeof updateReportBodySchema>;
export type RunReportBodyDto = z.infer<typeof runReportBodySchema>;
export type ExportReportBodyDto = z.infer<typeof exportReportBodySchema>;
export type ExportQueryDto = z.infer<typeof exportQuerySchema>;
export type HistoryQueryDto = z.infer<typeof historyQuerySchema>;
export type CreateScheduledBodyDto = z.infer<typeof createScheduledBodySchema>;
export type UpdateScheduledBodyDto = z.infer<typeof updateScheduledBodySchema>;
export type AnalyticsQueryDto = z.infer<typeof analyticsQuerySchema>;
