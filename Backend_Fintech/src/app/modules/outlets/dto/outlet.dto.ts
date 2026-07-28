import { z } from 'zod';

export const outletListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(['active', 'inactive', 'pending']).optional(),
  merchantId: z.coerce.number().int().min(1).optional(),
  organizationId: z.coerce.number().int().min(1).optional(),
});

export const outletIdParamSchema = z.object({ id: z.coerce.number().int().min(1) });

const workingHoursSchema = z.record(z.string(), z.object({
  open: z.string().optional(),
  close: z.string().optional(),
  closed: z.boolean().optional(),
}).optional()).optional();

export const createOutletBodySchema = z.object({
  outletName: z.string().min(2).max(255),
  outletCode: z.string().min(2).max(30).optional(),
  merchantId: z.number().int().min(1),
  organizationId: z.number().int().min(1).optional(),
  branchType: z.enum(['flagship', 'branch', 'warehouse', 'kiosk', 'popup', 'virtual']).optional(),
  storeNumber: z.string().max(50).optional(),
  gstNumber: z.string().max(20).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  status: z.enum(['active', 'inactive', 'pending']).optional(),
  openingDate: z.string().optional(),
  timezone: z.string().max(64).optional(),
  currency: z.string().length(3).optional(),
  isPrimary: z.boolean().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  workingHours: workingHoursSchema,
  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  country: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  pincode: z.string().max(20).optional(),
  notes: z.string().optional(),
  outletManagerId: z.number().int().min(1).optional(),
});

export const updateOutletBodySchema = createOutletBodySchema.partial().omit({ merchantId: true, organizationId: true });

export const outletStatusBodySchema = z.object({
  status: z.enum(['active', 'inactive']),
});

export type OutletListQueryDto = z.infer<typeof outletListQuerySchema>;
export type CreateOutletBodyDto = z.infer<typeof createOutletBodySchema>;
export type UpdateOutletBodyDto = z.infer<typeof updateOutletBodySchema>;
