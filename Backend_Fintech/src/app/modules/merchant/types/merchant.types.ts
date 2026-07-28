import { RowDataPacket } from 'mysql2/promise';
import {
  MerchantBusinessType,
  MerchantKycStatus,
  MerchantRiskLevel,
  MerchantStatus,
} from '../constants/merchant.constants';

export interface MerchantRow extends RowDataPacket {
  id: number;
  uuid: string;
  merchant_code: string;
  legal_name: string;
  display_name: string;
  logo_initials: string | null;
  logo_color: string | null;
  business_type: MerchantBusinessType | null;
  business_category: string | null;
  entity_type: string | null;
  registration_number: string | null;
  website: string | null;
  monthly_tpv_estimate: number | null;
  kyc_status: MerchantKycStatus;
  risk_level: MerchantRiskLevel;
  status: MerchantStatus;
  region_id: number;
  region_code: string | null;
  region_name: string | null;
  daily_volume: number;
  wallet_balance: number;
  onboarded_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface MerchantContactRow extends RowDataPacket {
  id: number;
  uuid: string;
  merchant_id: number;
  contact_type: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  job_title: string | null;
  is_primary: number;
}

export interface MerchantAddressRow extends RowDataPacket {
  id: number;
  uuid: string;
  merchant_id: number;
  address_type: string;
  line1: string;
  line2: string | null;
  city: string;
  state_province: string | null;
  postal_code: string | null;
  country_code: string;
  is_primary: number;
}

export interface MerchantDocumentRow extends RowDataPacket {
  id: number;
  uuid: string;
  merchant_id: number;
  document_type: string;
  file_name: string;
  file_url: string | null;
  status: string;
  created_at: Date;
}

export interface MerchantApiCredentialRow extends RowDataPacket {
  id: number;
  uuid: string;
  merchant_id: number;
  key_name: string;
  api_key_prefix: string;
  environment: string;
  is_active: number;
  last_used_at: Date | null;
  created_at: Date;
}

export interface MerchantTransactionRow extends RowDataPacket {
  id: number;
  uuid: string;
  transaction_ref: string;
  amount: number;
  currency: string;
  payment_method_detail: string;
  status_code: string;
  status_label: string;
  processed_at: Date;
  settled_at: Date | null;
}

export interface MerchantSettlementRow extends RowDataPacket {
  id: number;
  uuid: string;
  settlement_ref: string;
  amount: number;
  currency: string;
  status: string;
  processed_at: Date | null;
}

export interface MerchantStatisticsRow extends RowDataPacket {
  total: number;
  active_count: number;
  pending_count: number;
  suspended_count: number;
  verified_kyc_count: number;
  pending_kyc_count: number;
  high_risk_count: number;
}

export interface MerchantTagRow extends RowDataPacket {
  id: number;
  name: string;
  color: string | null;
}
