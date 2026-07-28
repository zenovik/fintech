export const CUSTOMER_STATUSES = ['active', 'inactive', 'blocked', 'pending'] as const;
export const CUSTOMER_KYC_STATUSES = ['verified', 'pending', 'rejected', 'not_required'] as const;
export const CUSTOMER_RISK_LEVELS = ['low', 'medium', 'high'] as const;
export const CUSTOMER_TYPES = ['individual', 'business'] as const;
export const CUSTOMER_DEFAULT_PAGE_SIZE = 10;
export const CUSTOMER_MAX_PAGE_SIZE = 50;

export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];
export type CustomerKycStatus = (typeof CUSTOMER_KYC_STATUSES)[number];
export type CustomerRiskLevel = (typeof CUSTOMER_RISK_LEVELS)[number];
export type CustomerType = (typeof CUSTOMER_TYPES)[number];
