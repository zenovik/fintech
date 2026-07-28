import { z } from 'zod';

export const roleListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().optional(),
});

export const roleIdParamSchema = z.object({ id: z.coerce.number().int().positive() });

export const createRoleBodySchema = z.object({
  code: z.string().min(2).max(50).regex(/^[a-z][a-z0-9_]*$/),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  permissionIds: z.array(z.number().int().positive()).optional(),
});

export const updateRoleBodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
});

export const assignRolePermissionsBodySchema = z.object({
  permissionIds: z.array(z.number().int().positive()),
});

export type RoleListQueryDto = z.infer<typeof roleListQuerySchema>;
export type CreateRoleBodyDto = z.infer<typeof createRoleBodySchema>;
export type UpdateRoleBodyDto = z.infer<typeof updateRoleBodySchema>;
export type AssignRolePermissionsBodyDto = z.infer<typeof assignRolePermissionsBodySchema>;
