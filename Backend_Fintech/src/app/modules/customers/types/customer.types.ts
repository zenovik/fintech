import { RowDataPacket } from 'mysql2/promise';

export interface CustomerRow extends RowDataPacket {
  id: number;
  uuid: string;
  customer_code: string;
  organization_id: number;
  primary_merchant_id: number | null;
  customer_type: string;
  first_name: string;
  last_name: string | null;
  display_name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  status: string;
  kyc_status: string;
  risk_level: string;
  region_id: number | null;
  total_spent: string;
  transaction_count: number;
  last_transaction_at: Date | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  organization_name?: string;
  organization_code?: string;
  merchant_name?: string;
  merchant_code?: string;
  region_code?: string;
  region_name?: string;
}

export interface CustomerAddressRow extends RowDataPacket {
  id: number;
  uuid: string;
  customer_id: number;
  address_type: string;
  line1: string;
  line2: string | null;
  city: string;
  state_province: string | null;
  postal_code: string | null;
  country_code: string;
  is_primary: number;
}

export interface CustomerMerchantRow extends RowDataPacket {
  id: number;
  customer_id: number;
  merchant_id: number;
  first_transaction_at: Date | null;
  last_transaction_at: Date | null;
  transaction_count: number;
  total_spent: string;
  merchant_code?: string;
  display_name?: string;
  status?: string;
}

export interface CustomerTransactionRow extends RowDataPacket {
  id: number;
  uuid: string;
  transaction_ref: string;
  amount: string;
  currency: string;
  payment_method_detail: string;
  status_code: string;
  status_label: string;
  merchant_id: number;
  merchant_name?: string;
  processed_at: Date;
  settled_at: Date | null;
}

export interface CustomerStatisticsRow extends RowDataPacket {
  total: number;
  active_count: number;
  inactive_count: number;
  blocked_count: number;
  pending_count: number;
  verified_kyc_count: number;
  high_risk_count: number;
}
