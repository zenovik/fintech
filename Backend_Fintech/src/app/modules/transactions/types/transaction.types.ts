import { RowDataPacket } from 'mysql2/promise';

export interface TransactionRow extends RowDataPacket {
  id: number;
  uuid: string;
  transaction_ref: string;
  merchant_id: number;
  merchant_code: string;
  merchant_name: string;
  logo_initials: string | null;
  logo_color: string | null;
  customer_name: string | null;
  customer_id: number | null;
  customer_email: string | null;
  description: string | null;
  amount: number;
  fee_amount: number;
  net_amount: number | null;
  currency: string;
  payment_method_type_id: number;
  payment_method_detail: string;
  payment_icon_key: string | null;
  status_id: number;
  status_code: string;
  status_label: string;
  badge_color: string;
  region_id: number;
  region_code: string | null;
  is_high_value: number;
  processed_at: Date;
  settled_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface TransactionEventRow extends RowDataPacket {
  id: number;
  uuid: string;
  event_type: string;
  event_data: string | null;
  created_at: Date;
}

export interface TransactionStatusHistoryRow extends RowDataPacket {
  id: number;
  from_status_code: string | null;
  from_status_label: string | null;
  to_status_code: string;
  to_status_label: string;
  reason: string | null;
  created_at: Date;
}

export interface TransactionRefundRow extends RowDataPacket {
  id: number;
  uuid: string;
  refund_ref: string;
  amount: number;
  currency: string;
  reason: string | null;
  status: string;
  processed_at: Date | null;
  created_at: Date;
}

export interface TransactionFeeRow extends RowDataPacket {
  id: number;
  fee_type: string;
  amount: number;
  currency: string;
  description: string | null;
}

export interface TransactionDisputeRow extends RowDataPacket {
  id: number;
  uuid: string;
  dispute_ref: string;
  transaction_id: number;
  transaction_ref: string;
  merchant_name: string;
  reason: string;
  status: string;
  amount: number;
  currency: string;
  evidence_due_at: Date | null;
  resolved_at: Date | null;
  created_at: Date;
}

export interface TransactionNoteRow extends RowDataPacket {
  id: number;
  uuid: string;
  note_text: string;
  is_internal: number;
  created_at: Date;
}

export interface TransactionAttachmentRow extends RowDataPacket {
  id: number;
  uuid: string;
  file_name: string;
  file_url: string;
  mime_type: string | null;
  created_at: Date;
}

export interface TransactionStatisticsRow extends RowDataPacket {
  total: number;
  total_volume: number;
  settled_count: number;
  pending_count: number;
  failed_count: number;
  flagged_count: number;
  high_value_count: number;
  refund_count: number;
  dispute_count: number;
}
