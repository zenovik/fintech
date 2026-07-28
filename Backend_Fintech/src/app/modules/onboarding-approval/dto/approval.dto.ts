import { z } from 'zod';

export const complianceQueueQuerySchema = z.object({
  queue: z.enum(['pending', 'assigned', 'overdue', 'completed']).default('pending'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  organizationId: z.coerce.number().int().min(1).optional(),
  reviewerId: z.coerce.number().int().min(1).optional(),
});

export const applicationIdParamSchema = z.object({ applicationId: z.coerce.number().int().min(1) });
export const documentIdParamSchema = z.object({
  applicationId: z.coerce.number().int().min(1),
  documentId: z.coerce.number().int().min(1),
});

export const decisionBodySchema = z.object({ remarks: z.string().max(2000).optional() });
export const reassignBodySchema = z.object({
  userId: z.number().int().min(1),
  roleCode: z.string().max(50).optional(),
  remarks: z.string().max(2000).optional(),
});
export const bulkAssignBodySchema = z.object({
  instanceIds: z.array(z.number().int().min(1)).min(1),
  userId: z.number().int().min(1),
  roleCode: z.string().max(50).optional(),
});

export const riskReviewBodySchema = z.object({
  businessCategory: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  kycScore: z.number().min(0).max(100).optional(),
  documentVerificationScore: z.number().min(0).max(100).optional(),
  watchlistMatch: z.boolean().optional(),
  blacklistMatch: z.boolean().optional(),
  manualRiskScore: z.number().min(0).max(100).optional(),
  finalRiskScore: z.number().min(0).max(100).optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  reviewerRemarks: z.string().max(2000).optional(),
  decision: z.enum(['pending', 'approved', 'rejected', 'escalated']).optional(),
});

export const kycDecisionBodySchema = z.object({
  decision: z.enum(['approved', 'rejected', 'reupload_requested']),
  remarks: z.string().max(2000).optional(),
});

export const suspendBodySchema = z.object({ reason: z.string().min(1).max(2000) });

export type ComplianceQueueQueryDto = z.infer<typeof complianceQueueQuerySchema>;
export type DecisionBodyDto = z.infer<typeof decisionBodySchema>;
export type ReassignBodyDto = z.infer<typeof reassignBodySchema>;
export type BulkAssignBodyDto = z.infer<typeof bulkAssignBodySchema>;
export type RiskReviewBodyDto = z.infer<typeof riskReviewBodySchema>;
export type KycDecisionBodyDto = z.infer<typeof kycDecisionBodySchema>;
