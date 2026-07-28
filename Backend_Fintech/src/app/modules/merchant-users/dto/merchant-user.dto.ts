import { z } from 'zod';

export const merchantUserListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(['active', 'inactive', 'pending', 'invited']).optional(),
  merchantId: z.coerce.number().int().min(1).optional(),
  organizationId: z.coerce.number().int().min(1).optional(),
});

export const merchantUserIdParamSchema = z.object({ id: z.coerce.number().int().min(1) });

export const createMerchantUserBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  merchantId: z.number().int().min(1),
  organizationId: z.number().int().min(1).optional(),
  merchantRoleId: z.number().int().min(1),
  defaultOutletId: z.number().int().min(1).optional(),
  accessScope: z.enum(['single', 'multiple', 'all']).optional(),
  outletIds: z.array(z.number().int().min(1)).optional(),
});

export const inviteMerchantUserBodySchema = createMerchantUserBodySchema.omit({ password: true }).extend({
  password: z.string().min(8).optional(),
});

export const updateMerchantUserBodySchema = z.object({
  merchantRoleId: z.number().int().min(1).optional(),
  defaultOutletId: z.number().int().min(1).nullable().optional(),
  accessScope: z.enum(['single', 'multiple', 'all']).optional(),
  status: z.enum(['active', 'inactive', 'pending', 'invited']).optional(),
});

export const assignRoleBodySchema = z.object({ merchantRoleId: z.number().int().min(1) });
export const assignOutletsBodySchema = z.object({
  outletIds: z.array(z.number().int().min(1)),
  accessScope: z.enum(['single', 'multiple', 'all']).optional(),
  defaultOutletId: z.number().int().min(1).optional(),
});
export const resetPasswordBodySchema = z.object({ password: z.string().min(8) });

export type MerchantUserListQueryDto = z.infer<typeof merchantUserListQuerySchema>;
export type CreateMerchantUserBodyDto = z.infer<typeof createMerchantUserBodySchema>;
export type InviteMerchantUserBodyDto = z.infer<typeof inviteMerchantUserBodySchema>;
export type UpdateMerchantUserBodyDto = z.infer<typeof updateMerchantUserBodySchema>;
export type AssignRoleBodyDto = z.infer<typeof assignRoleBodySchema>;
export type AssignOutletsBodyDto = z.infer<typeof assignOutletsBodySchema>;
