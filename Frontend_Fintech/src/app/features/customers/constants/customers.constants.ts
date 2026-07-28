export const CUSTOMERS_API = {
  BASE: '/customers',
  SEARCH: '/customers/search',
  STATISTICS: '/customers/statistics',
} as const;

export const CUSTOMER_ROUTES = {
  LIST: '/customers',
  CREATE: '/customers/create',
  DETAILS: '/customers',
} as const;

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50];

export const CUSTOMER_STATUS_OPTIONS = [
  { key: '', label: 'All Statuses' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'pending', label: 'Pending' },
] as const;

export const CUSTOMER_KYC_OPTIONS = [
  { key: '', label: 'All KYC' },
  { key: 'verified', label: 'Verified' },
  { key: 'pending', label: 'Pending' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'not_required', label: 'Not Required' },
] as const;

export const CUSTOMER_RISK_OPTIONS = [
  { key: '', label: 'All Risk' },
  { key: 'low', label: 'Low' },
  { key: 'medium', label: 'Medium' },
  { key: 'high', label: 'High' },
] as const;

export const CUSTOMER_TYPE_OPTIONS = [
  { key: '', label: 'All Types' },
  { key: 'individual', label: 'Individual' },
  { key: 'business', label: 'Business' },
] as const;

export const CUSTOMER_DETAIL_TABS = [
  { key: 'overview', label: 'Overview', icon: 'info' },
  { key: 'transactions', label: 'Transactions', icon: 'payments' },
  { key: 'merchants', label: 'Merchants', icon: 'storefront' },
  { key: 'addresses', label: 'Addresses', icon: 'location_on' },
] as const;

export const CUSTOMER_STATUSES = ['active', 'inactive', 'blocked', 'pending'] as const;
export const CUSTOMER_KYC_STATUSES = ['verified', 'pending', 'rejected', 'not_required'] as const;
export const CUSTOMER_RISK_LEVELS = ['low', 'medium', 'high'] as const;
export const CUSTOMER_TYPES = ['individual', 'business'] as const;

export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];
export type CustomerKycStatus = (typeof CUSTOMER_KYC_STATUSES)[number];
export type CustomerRiskLevel = (typeof CUSTOMER_RISK_LEVELS)[number];
export type CustomerType = (typeof CUSTOMER_TYPES)[number];
