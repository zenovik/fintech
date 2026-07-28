import { z } from 'zod';
import {
  CUSTOMER_KYC_STATUSES,
  CUSTOMER_RISK_LEVELS,
  CUSTOMER_STATUSES,
  CUSTOMER_TYPES,
} from '../constants/customers.constants';

const addressSchema = z.object({
  addressType: z.enum(['billing', 'shipping', 'other']).optional().default('billing'),
  line1: z.string().min(1).max(255),
  line2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  stateProvince: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  countryCode: z.string().length(2).optional().default('US'),
  isPrimary: z.boolean().optional().default(true),
});

export const customerListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
  search: z.string().max(100).optional(),
  status: z.enum(CUSTOMER_STATUSES).optional(),
  kycStatus: z.enum(CUSTOMER_KYC_STATUSES).optional(),
  riskLevel: z.enum(CUSTOMER_RISK_LEVELS).optional(),
  customerType: z.enum(CUSTOMER_TYPES).optional(),
  organizationId: z.coerce.number().int().min(1).optional(),
  merchantId: z.coerce.number().int().min(1).optional(),
  regionId: z.coerce.number().int().min(1).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(['created_at', 'display_name', 'total_spent', 'last_transaction_at']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const customerSearchQuerySchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  organizationId: z.coerce.number().int().min(1).optional(),
});

export const createCustomerBodySchema = z.object({
  primaryMerchantId: z.number().int().min(1).optional(),
  customerType: z.enum(CUSTOMER_TYPES).optional().default('individual'),
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
  displayName: z.string().min(1).max(255).optional(),
  email: z.string().email().max(255).optional().or(z.literal('')),
  phone: z.string().max(30).optional(),
  companyName: z.string().max(255).optional(),
  regionId: z.number().int().min(1).optional(),
  kycStatus: z.enum(CUSTOMER_KYC_STATUSES).optional().default('pending'),
  riskLevel: z.enum(CUSTOMER_RISK_LEVELS).optional().default('low'),
  status: z.enum(CUSTOMER_STATUSES).optional().default('active'),
  notes: z.string().max(2000).optional(),
  addresses: z.array(addressSchema).optional(),
});

export const updateCustomerBodySchema = createCustomerBodySchema.partial();

export const updateCustomerStatusBodySchema = z.object({
  status: z.enum(CUSTOMER_STATUSES),
  reason: z.string().max(500).optional(),
});

export const customerIdParamSchema = z.object({
  id: z.coerce.number().int().min(1),
});

export const customerTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export type CustomerListQueryDto = z.infer<typeof customerListQuerySchema>;
export type CustomerSearchQueryDto = z.infer<typeof customerSearchQuerySchema>;
export type CreateCustomerBodyDto = z.infer<typeof createCustomerBodySchema>;
export type CreateCustomerWithOrgDto = CreateCustomerBodyDto & { organizationId: number };
export type UpdateCustomerBodyDto = z.infer<typeof updateCustomerBodySchema>;
export type UpdateCustomerStatusBodyDto = z.infer<typeof updateCustomerStatusBodySchema>;
export type CustomerTransactionsQueryDto = z.infer<typeof customerTransactionsQuerySchema>;
