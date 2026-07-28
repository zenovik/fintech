import { z } from 'zod';
import {
  MERCHANT_BUSINESS_TYPES,
  MERCHANT_KYC_STATUSES,
  MERCHANT_RISK_LEVELS,
  MERCHANT_STATUSES,
  MERCHANT_DOCUMENT_STATUSES,
} from '../constants/merchant.constants';

const contactSchema = z.object({
  contactType: z.enum(['primary', 'billing', 'support', 'technical']).optional().default('primary'),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(30).optional(),
  jobTitle: z.string().max(100).optional(),
  isPrimary: z.boolean().optional().default(false),
});

const addressSchema = z.object({
  addressType: z.enum(['registered', 'billing', 'shipping', 'other']).optional().default('registered'),
  line1: z.string().min(1).max(255),
  line2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  stateProvince: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  countryCode: z.string().length(2).optional().default('US'),
  isPrimary: z.boolean().optional().default(true),
});

export const merchantListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
  search: z.string().max(100).optional(),
  status: z.enum(MERCHANT_STATUSES).optional(),
  kycStatus: z.enum(MERCHANT_KYC_STATUSES).optional(),
  riskLevel: z.enum(MERCHANT_RISK_LEVELS).optional(),
  businessType: z.enum(MERCHANT_BUSINESS_TYPES).optional(),
  regionId: z.coerce.number().int().min(1).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(['created_at', 'display_name', 'merchant_code', 'daily_volume']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const merchantSearchQuerySchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const createMerchantBodySchema = z.object({
  legalName: z.string().min(1).max(255),
  displayName: z.string().min(1).max(255),
  businessType: z.enum(MERCHANT_BUSINESS_TYPES).optional(),
  businessCategory: z.string().max(100).optional(),
  entityType: z.string().max(100).optional(),
  registrationNumber: z.string().max(100).optional(),
  website: z.string().url().max(255).optional().or(z.literal('')),
  monthlyTpvEstimate: z.number().min(0).optional(),
  regionId: z.coerce.number().int().min(1).optional().default(1),
  kycStatus: z.enum(MERCHANT_KYC_STATUSES).optional().default('pending'),
  riskLevel: z.enum(MERCHANT_RISK_LEVELS).optional().default('low'),
  status: z.enum(MERCHANT_STATUSES).optional().default('pending'),
  contacts: z.array(contactSchema).optional(),
  addresses: z.array(addressSchema).optional(),
});

export const updateMerchantBodySchema = createMerchantBodySchema.partial().extend({
  logoInitials: z.string().max(4).optional(),
  logoColor: z.string().max(20).optional(),
});

export const updateMerchantStatusBodySchema = z.object({
  status: z.enum(MERCHANT_STATUSES),
  reason: z.string().max(500).optional(),
});

export const createDocumentBodySchema = z.object({
  documentType: z.string().min(1).max(50),
  fileName: z.string().min(1).max(255),
  fileUrl: z.string().max(500).optional(),
  status: z.enum(MERCHANT_DOCUMENT_STATUSES).optional().default('pending'),
});

export const merchantIdParamSchema = z.object({
  id: z.coerce.number().int().min(1),
});

export const merchantDocumentParamSchema = z.object({
  id: z.coerce.number().int().min(1),
  documentId: z.coerce.number().int().min(1),
});

export const merchantTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export type MerchantListQueryDto = z.infer<typeof merchantListQuerySchema>;
export type MerchantSearchQueryDto = z.infer<typeof merchantSearchQuerySchema>;
export type CreateMerchantBodyDto = z.infer<typeof createMerchantBodySchema>;
export type UpdateMerchantBodyDto = z.infer<typeof updateMerchantBodySchema>;
export type UpdateMerchantStatusBodyDto = z.infer<typeof updateMerchantStatusBodySchema>;
export type CreateDocumentBodyDto = z.infer<typeof createDocumentBodySchema>;
export type MerchantTransactionsQueryDto = z.infer<typeof merchantTransactionsQuerySchema>;
