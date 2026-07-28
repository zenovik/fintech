import { RowDataPacket } from 'mysql2/promise';

export interface PayoutRow extends RowDataPacket {
  id: number;
  uuid: string;
  payout_ref: string;
  merchant_id: number;
  settlement_id: number | null;
  bank_account_id: number | null;
  batch_id: number | null;
  amount: string;
  fee_amount: string;
  currency: string;
  payout_type: string;
  payout_method: string;
  status: string;
  transfer_ref: string | null;
  failure_reason: string | null;
  notes: string | null;
  scheduled_at: Date | null;
  processed_at: Date | null;
  confirmed_at: Date | null;
  approved_by: number | null;
  approved_at: Date | null;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
  merchant_name?: string;
  merchant_code?: string;
  settlement_ref?: string;
  bank_name?: string;
  account_masked?: string;
  approved_by_name?: string;
  created_by_name?: string;
}

export interface PayoutHistoryRow extends RowDataPacket {
  id: number;
  payout_id: number;
  from_status: string | null;
  to_status: string;
  reason: string | null;
  changed_by: number | null;
  created_at: Date;
  changed_by_name?: string;
}

export interface BankAccountRow extends RowDataPacket {
  id: number;
  uuid: string;
  merchant_id: number;
  account_holder: string;
  bank_name: string | null;
  account_number_masked: string;
  iban: string | null;
  swift_bic: string | null;
  currency: string;
  is_primary: number;
  created_at: Date;
  merchant_name?: string;
}

export interface PayoutStatisticsRow extends RowDataPacket {
  total: number;
  pending_count: number;
  scheduled_count: number;
  processing_count: number;
  sent_count: number;
  confirmed_count: number;
  failed_count: number;
  cancelled_count: number;
  pending_amount: string;
  confirmed_amount: string;
  failed_amount: string;
}
