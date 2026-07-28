export const ORGANIZATION_STATUSES = ['active', 'inactive', 'pending', 'archived'] as const;
export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

export const MEMBER_STATUSES = ['active', 'invited', 'suspended', 'removed'] as const;
export const DOMAIN_STATUSES = ['pending', 'verified', 'failed', 'removed'] as const;
export const API_KEY_ENVIRONMENTS = ['live', 'test'] as const;
export const BILLING_CYCLES = ['monthly', 'yearly'] as const;
export const BILLING_STATUSES = ['active', 'past_due', 'cancelled', 'trialing'] as const;
export const ADDRESS_TYPES = ['registered', 'billing', 'shipping', 'other'] as const;
export const CONTACT_TYPES = ['primary', 'billing', 'support', 'technical'] as const;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
