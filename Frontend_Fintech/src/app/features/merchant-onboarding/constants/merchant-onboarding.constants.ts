export const ONBOARDING_ROUTES = {
  LIST: '/merchant-onboarding',
  CREATE: '/merchant-onboarding/create',
  DETAIL: (id: number | string) => `/merchant-onboarding/${id}`,
  WIZARD: (id: number | string) => `/merchant-onboarding/${id}/wizard`,
} as const;

export const ONBOARDING_API = {
  BASE: '/merchant-onboarding',
  STATISTICS: '/merchant-onboarding/statistics',
} as const;

export const ONBOARDING_STATUSES = [
  'draft', 'submitted', 'kyc_pending', 'under_review',
  'approved', 'rejected', 'go_live', 'suspended', 'inactive',
] as const;

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', submitted: 'Submitted', kyc_pending: 'KYC Pending', under_review: 'Under Review',
  approved: 'Approved', rejected: 'Rejected', go_live: 'Go Live', suspended: 'Suspended', inactive: 'Inactive',
};

export const BUSINESS_TYPES = ['saas', 'retail', 'services', 'logistics', 'fintech', 'healthcare', 'other'] as const;
export const SETTLEMENT_CYCLES = ['t0', 't1', 't2', 'weekly', 'monthly'] as const;
export const SETTLEMENT_METHODS = ['bank_transfer', 'neft', 'rtgs', 'imps'] as const;
export const KYC_DOC_TYPES = ['pan', 'gst_certificate', 'cancelled_cheque', 'address_proof', 'owner_id'] as const;
export const KYC_DOC_LABELS: Record<string, string> = {
  pan: 'PAN Card', gst_certificate: 'GST Certificate', cancelled_cheque: 'Cancelled Cheque',
  address_proof: 'Address Proof', owner_id: 'Owner ID',
};
export const DEFAULT_PAGE_SIZE = 10;
