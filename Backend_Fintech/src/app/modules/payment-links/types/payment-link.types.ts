import { RowDataPacket } from 'mysql2';

export interface PaymentLinkRow extends RowDataPacket {
  id: number;
  uuid: string;
  organization_id: number;
  merchant_id: number;
  customer_id: number | null;
  link_ref: string;
  title: string;
  description: string | null;
  amount: string | null;
  currency: string;
  allow_custom_amount: number;
  expires_at: Date | null;
  max_usage: number | null;
  current_usage: number;
  status: string;
  public_token: string;
  redirect_url: string | null;
  success_url: string | null;
  cancel_url: string | null;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
  organization_name?: string | null;
  organization_code?: string | null;
  merchant_name?: string | null;
  merchant_code?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  created_by_name?: string | null;
  updated_by_name?: string | null;
  total_collected?: string | null;
}

export interface PaymentLinkStatisticsRow extends RowDataPacket {
  total: number;
  active_count: number;
  disabled_count: number;
  expired_count: number;
  total_collected: string;
  total_usage: number;
  conversion_rate: string;
}

export interface PaymentLinkTransactionRow extends RowDataPacket {
  id: number;
  payment_link_id: number;
  transaction_id: number;
  paid_amount: string;
  created_at: Date;
  transaction_ref?: string;
  transaction_status?: string;
}
