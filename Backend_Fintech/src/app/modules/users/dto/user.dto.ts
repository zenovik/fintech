import { z } from 'zod';

export const userListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(['active', 'locked', 'pending', 'inactive']).optional(),
  roleId: z.coerce.number().int().optional(),
  sortBy: z.enum(['created_at', 'email', 'last_name']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const userIdParamSchema = z.object({ id: z.coerce.number().int().positive() });

export const createUserBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phoneNumber: z.string().max(20).optional(),
  status: z.enum(['active', 'pending', 'inactive']).default('pending'),
  roleIds: z.array(z.number().int().positive()).optional(),
});

export const updateUserBodySchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phoneNumber: z.string().max(20).nullable().optional(),
  status: z.enum(['active', 'locked', 'pending', 'inactive']).optional(),
});

export const updateUserStatusBodySchema = z.object({
  status: z.enum(['active', 'locked', 'pending', 'inactive']),
  reason: z.string().max(500).optional(),
});

export const assignUserRolesBodySchema = z.object({
  roleIds: z.array(z.number().int().positive()),
});

export type UserListQueryDto = z.infer<typeof userListQuerySchema>;
export type CreateUserBodyDto = z.infer<typeof createUserBodySchema>;
export type UpdateUserBodyDto = z.infer<typeof updateUserBodySchema>;
export type UpdateUserStatusBodyDto = z.infer<typeof updateUserStatusBodySchema>;
export type AssignUserRolesBodyDto = z.infer<typeof assignUserRolesBodySchema>;
