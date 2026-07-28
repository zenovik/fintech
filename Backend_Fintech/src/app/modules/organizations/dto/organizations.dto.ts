import { z } from 'zod';
import {
  ADDRESS_TYPES,
  API_KEY_ENVIRONMENTS,
  BILLING_CYCLES,
  BILLING_STATUSES,
  CONTACT_TYPES,
  DOMAIN_STATUSES,
  MEMBER_STATUSES,
  ORGANIZATION_STATUSES,
} from '../constants/organizations.constants';

export const organizationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().max(200).optional(),
  status: z.enum(ORGANIZATION_STATUSES).optional(),
  sortBy: z.enum(['created_at', 'display_name', 'legal_name', 'status']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const organizationIdParamSchema = z.object({
  id: z.coerce.number().int().min(1),
});

export const addressSchema = z.object({
  addressType: z.enum(ADDRESS_TYPES).optional().default('registered'),
  line1: z.string().min(1).max(255),
  line2: z.string().max(255).optional(),
  city: z.string().min(1).max(128),
  stateProvince: z.string().max(128).optional(),
  postalCode: z.string().max(32).optional(),
  countryCode: z.string().length(2).optional().default('US'),
  isPrimary: z.boolean().optional().default(true),
});

export const contactSchema = z.object({
  contactType: z.enum(CONTACT_TYPES).optional().default('primary'),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(30).optional(),
  jobTitle: z.string().max(100).optional(),
  isPrimary: z.boolean().optional().default(false),
});

export const createOrganizationBodySchema = z.object({
  code: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/),
  legalName: z.string().min(1).max(255),
  displayName: z.string().min(1).max(255),
  dbaName: z.string().max(255).optional(),
  taxId: z.string().max(64).optional(),
  industry: z.string().max(128).optional(),
  website: z.string().url().max(255).optional().or(z.literal('')),
  status: z.enum(ORGANIZATION_STATUSES).optional().default('pending'),
  logoUrl: z.string().max(512).optional().nullable(),
  logoInitials: z.string().max(8).optional(),
  primaryColor: z.string().max(16).optional(),
  baseCurrency: z.string().length(3).optional().default('USD'),
  timezone: z.string().max(64).optional().default('UTC'),
  locale: z.string().max(16).optional().default('en-US'),
  primaryRegion: z.string().max(64).optional(),
  description: z.string().max(2000).optional(),
  addresses: z.array(addressSchema).optional(),
  contacts: z.array(contactSchema).optional(),
});

export const updateOrganizationBodySchema = createOrganizationBodySchema.partial().omit({ code: true });

export const updateOrganizationStatusBodySchema = z.object({
  status: z.enum(ORGANIZATION_STATUSES),
  reason: z.string().max(500).optional(),
});

export const createMemberBodySchema = z.object({
  userId: z.number().int().min(1),
  orgRoleId: z.number().int().min(1),
  status: z.enum(MEMBER_STATUSES).optional().default('invited'),
  isDefault: z.boolean().optional().default(false),
});

export const updateMemberBodySchema = z.object({
  orgRoleId: z.number().int().min(1).optional(),
  status: z.enum(MEMBER_STATUSES).optional(),
  isDefault: z.boolean().optional(),
});

export const memberIdParamSchema = z.object({
  id: z.coerce.number().int().min(1),
  memberId: z.coerce.number().int().min(1),
});

export const createDomainBodySchema = z.object({
  domain: z.string().min(3).max(255),
  isPrimary: z.boolean().optional().default(false),
});

export const updateDomainBodySchema = z.object({
  isPrimary: z.boolean().optional(),
  status: z.enum(DOMAIN_STATUSES).optional(),
});

export const domainIdParamSchema = z.object({
  id: z.coerce.number().int().min(1),
  domainId: z.coerce.number().int().min(1),
});

export const brandingBodySchema = z.object({
  companyName: z.string().min(1).max(255),
  logoUrl: z.string().max(512).optional().nullable(),
  logoInitials: z.string().max(8).optional(),
  primaryColor: z.string().max(16),
  secondaryColor: z.string().max(16),
  accentColor: z.string().max(16),
  faviconUrl: z.string().max(512).optional().nullable(),
});

export const preferencesBodySchema = z.object({
  preferences: z.record(z.string(), z.unknown()),
});

export const createApiKeyBodySchema = z.object({
  name: z.string().min(1).max(150),
  environment: z.enum(API_KEY_ENVIRONMENTS).optional().default('test'),
});

export const apiKeyIdParamSchema = z.object({
  id: z.coerce.number().int().min(1),
  keyId: z.coerce.number().int().min(1),
});

export const billingBodySchema = z.object({
  planCode: z.string().min(1).max(64).optional(),
  planName: z.string().min(1).max(150).optional(),
  billingEmail: z.string().email().max(255).optional().nullable(),
  billingCycle: z.enum(BILLING_CYCLES).optional(),
  status: z.enum(BILLING_STATUSES).optional(),
  currency: z.string().length(3).optional(),
  amount: z.number().min(0).optional(),
  nextBillingAt: z.string().optional().nullable(),
  taxExempt: z.boolean().optional(),
  paymentMethodLast4: z.string().max(4).optional().nullable(),
  paymentMethodBrand: z.string().max(32).optional().nullable(),
});

export type OrganizationListQueryDto = z.infer<typeof organizationListQuerySchema>;
export type CreateOrganizationBodyDto = z.infer<typeof createOrganizationBodySchema>;
export type UpdateOrganizationBodyDto = z.infer<typeof updateOrganizationBodySchema>;
export type UpdateOrganizationStatusBodyDto = z.infer<typeof updateOrganizationStatusBodySchema>;
export type CreateMemberBodyDto = z.infer<typeof createMemberBodySchema>;
export type UpdateMemberBodyDto = z.infer<typeof updateMemberBodySchema>;
export type CreateDomainBodyDto = z.infer<typeof createDomainBodySchema>;
export type UpdateDomainBodyDto = z.infer<typeof updateDomainBodySchema>;
export type BrandingBodyDto = z.infer<typeof brandingBodySchema>;
export type PreferencesBodyDto = z.infer<typeof preferencesBodySchema>;
export type CreateApiKeyBodyDto = z.infer<typeof createApiKeyBodySchema>;
export type BillingBodyDto = z.infer<typeof billingBodySchema>;
