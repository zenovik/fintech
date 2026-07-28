export const MERCHANT_ROUTES = {
  LIST: '/merchants',
  CREATE: '/merchants/create',
  DETAIL: (id: number | string) => `/merchants/${id}`,
  EDIT: (id: number | string) => `/merchants/${id}/edit`,
} as const;

export const MERCHANT_API = {
  BASE: '/merchants',
  SEARCH: '/merchants/search',
  STATISTICS: '/merchants/statistics',
} as const;

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

export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
export const DEFAULT_PAGE_SIZE = 10;

export type MerchantStatus = (typeof MERCHANT_STATUSES)[number];
export type MerchantKycStatus = (typeof MERCHANT_KYC_STATUSES)[number];
export type MerchantRiskLevel = (typeof MERCHANT_RISK_LEVELS)[number];
export type MerchantBusinessType = (typeof MERCHANT_BUSINESS_TYPES)[number];
export type MerchantPageState = 'idle' | 'loading' | 'loaded' | 'empty' | 'error';
