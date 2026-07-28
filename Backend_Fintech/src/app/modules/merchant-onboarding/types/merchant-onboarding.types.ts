import { RowDataPacket } from 'mysql2/promise';
import { OnboardingStatus } from '../constants/merchant-onboarding.constants';

export interface ApplicationRow extends RowDataPacket {
  id: number;
  uuid: string;
  application_ref: string;
  organization_id: number;
  merchant_id: number | null;
  onboarding_status: OnboardingStatus;
  current_step: number;
  rejection_reason: string | null;
  submitted_at: Date | null;
  approved_at: Date | null;
  rejected_at: Date | null;
  go_live_at: Date | null;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
  organization_name?: string;
  business_name?: string;
  legal_name?: string;
  industry?: string;
}

export interface BusinessRow extends RowDataPacket {
  application_id: number;
  business_name: string;
  legal_name: string;
  merchant_category: string | null;
  industry: string | null;
  website: string | null;
  email: string;
  phone: string | null;
  gst_number: string | null;
  pan_number: string | null;
  cin_number: string | null;
  business_type: string | null;
}

export interface AddressRow extends RowDataPacket {
  id: number;
  uuid: string;
  application_id: number;
  address_type: string;
  line1: string;
  line2: string | null;
  country: string;
  state: string | null;
  city: string;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface KycDocumentRow extends RowDataPacket {
  id: number;
  uuid: string;
  application_id: number;
  document_type: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  storage_path: string | null;
  created_at: Date;
}

export interface BankDetailsRow extends RowDataPacket {
  application_id: number;
  account_holder: string;
  account_number_masked: string;
  ifsc: string;
  bank_name: string;
  branch: string | null;
  account_type: string;
  verification_status: string;
}

export interface SettlementConfigRow extends RowDataPacket {
  application_id: number;
  settlement_cycle: string;
  settlement_currency: string;
  settlement_method: string;
  min_settlement_amount: number;
  reserve_pct: number;
  rolling_reserve_pct: number;
}

export interface PaymentConfigRow extends RowDataPacket {
  application_id: number;
  enable_cards: number;
  enable_upi: number;
  enable_net_banking: number;
  enable_wallet: number;
  enable_emi: number;
  enable_bnpl: number;
  enable_qr: number;
  enable_payment_links: number;
  enable_subscriptions: number;
}

export interface TimelineRow extends RowDataPacket {
  id: number;
  uuid: string;
  application_id: number;
  event_type: string;
  summary: string;
  actor_user_id: number | null;
  actor_name: string | null;
  metadata: string | null;
  created_at: Date;
}

export interface StatisticsRow extends RowDataPacket {
  total: number;
  draft_count: number;
  submitted_count: number;
  kyc_pending_count: number;
  under_review_count: number;
  approved_count: number;
  rejected_count: number;
  go_live_count: number;
  suspended_count: number;
  inactive_count: number;
  pending_onboarding: number;
}
