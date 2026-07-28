import { z } from 'zod';
import { ALERT_STATUSES, INCIDENT_STATUSES, JOB_STATUSES, RETRY_STATUSES } from '../constants/operations.constants';

export const alertListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
  status: z.enum(ALERT_STATUSES).optional(),
  severity: z.string().optional(),
});

export const incidentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
  status: z.enum(INCIDENT_STATUSES).optional(),
  severity: z.string().optional(),
});

export const retryListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
  status: z.enum(RETRY_STATUSES).optional(),
  entityType: z.string().optional(),
});

export const jobListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
  status: z.enum(JOB_STATUSES).optional(),
  jobType: z.string().optional(),
});

export const idParamSchema = z.object({ id: z.coerce.number().int().min(1) });

export type AlertListQueryDto = z.infer<typeof alertListQuerySchema>;
export type IncidentListQueryDto = z.infer<typeof incidentListQuerySchema>;
export type RetryListQueryDto = z.infer<typeof retryListQuerySchema>;
export type JobListQueryDto = z.infer<typeof jobListQuerySchema>;
