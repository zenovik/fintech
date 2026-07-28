export const MERCHANT_STATUSES = ['active', 'pending', 'suspended', 'inactive'] as const;
export const MERCHANT_KYC_STATUSES = ['verified', 'pending', 'rejected'] as const;
export const MERCHANT_RISK_LEVELS = ['low', 'medium', 'high'] as const;
export const MERCHANT_BUSINESS_TYPES = [
  'saas',
  'retail',
  'services',
  'logistics',
  'fintech',
  'healthcare',
  'other',
] as const;
export const MERCHANT_DOCUMENT_STATUSES = ['approved', 'pending', 'rejected', 'missing'] as const;
export const MERCHANT_DEFAULT_PAGE_SIZE = 10;
export const MERCHANT_MAX_PAGE_SIZE = 50;

export type MerchantStatus = (typeof MERCHANT_STATUSES)[number];
export type MerchantKycStatus = (typeof MERCHANT_KYC_STATUSES)[number];
export type MerchantRiskLevel = (typeof MERCHANT_RISK_LEVELS)[number];
export type MerchantBusinessType = (typeof MERCHANT_BUSINESS_TYPES)[number];
