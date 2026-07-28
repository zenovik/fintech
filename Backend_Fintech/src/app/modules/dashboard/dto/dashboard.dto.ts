import { z } from 'zod';
import { DASHBOARD_EXPORT_FORMATS, DASHBOARD_PERIOD_TYPES } from '../constants/dashboard.constants';

export const periodQuerySchema = z.object({
  period: z.enum(DASHBOARD_PERIOD_TYPES).optional().default('monthly'),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const highValueTransactionsQuerySchema = z.object({
  period: z.enum(DASHBOARD_PERIOD_TYPES).optional().default('monthly'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
  search: z.string().max(100).optional(),
  status: z.string().max(20).optional(),
  paymentMethod: z.string().max(30).optional(),
  minAmount: z.coerce.number().min(0).optional(),
});

export const exportBodySchema = z.object({
  format: z.enum(DASHBOARD_EXPORT_FORMATS).default('csv'),
  period: z.enum(DASHBOARD_PERIOD_TYPES).optional().default('monthly'),
  sections: z.array(z.string()).optional(),
});

export const preferencesBodySchema = z.object({
  defaultDateRange: z.enum([...DASHBOARD_PERIOD_TYPES, 'custom'] as const).optional(),
  customDateFrom: z.string().nullable().optional(),
  customDateTo: z.string().nullable().optional(),
  highValueThreshold: z.number().min(0).optional(),
  tablePageSize: z.coerce.number().int().min(1).max(50).optional(),
});

export type PeriodQueryDto = z.infer<typeof periodQuerySchema>;
export type HighValueTransactionsQueryDto = z.infer<typeof highValueTransactionsQuerySchema>;
export type ExportBodyDto = z.infer<typeof exportBodySchema>;
export type PreferencesBodyDto = z.infer<typeof preferencesBodySchema>;
