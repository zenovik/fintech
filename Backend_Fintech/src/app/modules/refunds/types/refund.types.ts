import { RowDataPacket } from 'mysql2/promise';

export interface RefundRow extends RowDataPacket {
  id: number;
  uuid: string;
  transaction_id: number;
  merchant_id: number;
  customer_id: number | null;
  refund_ref: string;
  refund_type: string;
  amount: string;
  currency: string;
  reason: string | null;
  status: string;
  requested_by: number | null;
  approved_by: number | null;
  rejected_by: number | null;
  approved_at: Date | null;
  rejected_at: Date | null;
  rejection_reason: string | null;
  processed_at: Date | null;
  created_at: Date;
  updated_at: Date;
  transaction_ref?: string;
  transaction_amount?: string;
  merchant_name?: string;
  merchant_code?: string;
  customer_name?: string;
  customer_email?: string;
  requested_by_name?: string;
  approved_by_name?: string;
  rejected_by_name?: string;
}

export interface RefundHistoryRow extends RowDataPacket {
  id: number;
  refund_id: number;
  from_status: string | null;
  to_status: string;
  reason: string | null;
  changed_by: number | null;
  created_at: Date;
  changed_by_name?: string;
}

export interface RefundStatisticsRow extends RowDataPacket {
  total: number;
  pending_count: number;
  approved_count: number;
  rejected_count: number;
  processed_count: number;
  failed_count: number;
  pending_amount: string;
  processed_amount: string;
}
