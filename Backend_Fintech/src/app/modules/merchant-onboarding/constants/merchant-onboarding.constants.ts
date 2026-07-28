export const ONBOARDING_STATUSES = [
  'draft', 'submitted', 'kyc_pending', 'under_review',
  'compliance_review', 'risk_review', 'business_review', 'sent_back',
  'approved', 'rejected', 'go_live', 'completed', 'suspended', 'inactive',
] as const;

export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number];

export const ONBOARDING_STEPS = [
  'business', 'address', 'kyc', 'bank', 'settlement', 'payment', 'review', 'submit',
] as const;

export const SETTLEMENT_CYCLES = ['t0', 't1', 't2', 'weekly', 'monthly'] as const;
export const SETTLEMENT_METHODS = ['bank_transfer', 'neft', 'rtgs', 'imps'] as const;
export const KYC_DOCUMENT_TYPES = ['pan', 'gst_certificate', 'cancelled_cheque', 'address_proof', 'owner_id'] as const;
export const ADDRESS_TYPES = ['registered', 'operating'] as const;
export const ACCOUNT_TYPES = ['savings', 'current'] as const;
export const BANK_VERIFICATION_STATUSES = ['pending', 'verified', 'failed'] as const;
export const TIMELINE_EVENT_TYPES = [
  'created', 'updated', 'submitted', 'kyc_pending', 'under_review',
  'compliance_review', 'risk_review', 'business_review', 'sent_back',
  'assigned', 'reviewed', 'approved', 'rejected', 'go_live', 'completed', 'activated',
  'suspended', 'inactive', 'sla_warning', 'sla_breach', 'document_verified', 'document_rejected',
] as const;

export const ONBOARDING_PAGE_SIZES = [10, 25, 50] as const;
