import { z } from 'zod';
import {
  ACCOUNT_TYPES, ADDRESS_TYPES, BANK_VERIFICATION_STATUSES,
  KYC_DOCUMENT_TYPES, ONBOARDING_STATUSES, SETTLEMENT_CYCLES, SETTLEMENT_METHODS,
} from '../constants/merchant-onboarding.constants';

export const applicationIdParamSchema = z.object({ id: z.coerce.number().int().positive() });

export const onboardingListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(ONBOARDING_STATUSES).optional(),
  sortBy: z.enum(['created_at', 'submitted_at', 'application_ref']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const businessInfoSchema = z.object({
  businessName: z.string().min(2).max(255),
  legalName: z.string().min(2).max(255),
  merchantCategory: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  website: z.string().max(255).optional().or(z.literal('')),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  gstNumber: z.string().max(20).optional(),
  panNumber: z.string().max(15).optional(),
  cinNumber: z.string().max(25).optional(),
  businessType: z.enum(['saas', 'retail', 'services', 'logistics', 'fintech', 'healthcare', 'other']).optional(),
});

export const addressSchema = z.object({
  addressType: z.enum(ADDRESS_TYPES),
  line1: z.string().min(2).max(255),
  line2: z.string().max(255).optional(),
  country: z.string().min(2).max(100).default('India'),
  state: z.string().max(100).optional(),
  city: z.string().min(2).max(100),
  pincode: z.string().max(20).optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

export const addressesBodySchema = z.object({ addresses: z.array(addressSchema).min(1).max(2) });

export const kycDocumentSchema = z.object({
  documentType: z.enum(KYC_DOCUMENT_TYPES),
  fileName: z.string().min(1).max(255),
  fileSize: z.coerce.number().int().min(0).optional(),
  mimeType: z.string().max(100).optional(),
  storagePath: z.string().max(500).optional(),
});

export const kycDocumentsBodySchema = z.object({ documents: z.array(kycDocumentSchema).min(1) });

export const bankDetailsSchema = z.object({
  accountHolder: z.string().min(2).max(255),
  accountNumber: z.string().min(4).max(30),
  ifsc: z.string().min(5).max(15),
  bankName: z.string().min(2).max(255),
  branch: z.string().max(255).optional(),
  accountType: z.enum(ACCOUNT_TYPES).default('current'),
  verificationStatus: z.enum(BANK_VERIFICATION_STATUSES).default('pending'),
});

export const settlementConfigSchema = z.object({
  settlementCycle: z.enum(SETTLEMENT_CYCLES).default('t1'),
  settlementCurrency: z.string().length(3).default('INR'),
  settlementMethod: z.enum(SETTLEMENT_METHODS).default('bank_transfer'),
  minSettlementAmount: z.coerce.number().min(0).default(1000),
  reservePct: z.coerce.number().min(0).max(100).default(0),
  rollingReservePct: z.coerce.number().min(0).max(100).default(0),
});

export const paymentConfigSchema = z.object({
  enableCards: z.boolean().default(true),
  enableUpi: z.boolean().default(true),
  enableNetBanking: z.boolean().default(false),
  enableWallet: z.boolean().default(false),
  enableEmi: z.boolean().default(false),
  enableBnpl: z.boolean().default(false),
  enableQr: z.boolean().default(false),
  enablePaymentLinks: z.boolean().default(false),
  enableSubscriptions: z.boolean().default(false),
});

export const rejectBodySchema = z.object({ reason: z.string().min(5).max(1000) });
export const suspendBodySchema = z.object({ reason: z.string().min(5).max(1000).optional() });

export type OnboardingListQueryDto = z.infer<typeof onboardingListQuerySchema>;
export type BusinessInfoDto = z.infer<typeof businessInfoSchema>;
export type AddressesBodyDto = z.infer<typeof addressesBodySchema>;
export type KycDocumentsBodyDto = z.infer<typeof kycDocumentsBodySchema>;
export type BankDetailsDto = z.infer<typeof bankDetailsSchema>;
export type SettlementConfigDto = z.infer<typeof settlementConfigSchema>;
export type PaymentConfigDto = z.infer<typeof paymentConfigSchema>;
export type RejectBodyDto = z.infer<typeof rejectBodySchema>;
export type SuspendBodyDto = z.infer<typeof suspendBodySchema>;
