import { RowDataPacket } from 'mysql2/promise';

export interface ChargebackRow extends RowDataPacket {
  id: number;
  uuid: string;
  transaction_id: number;
  merchant_id: number;
  customer_id: number | null;
  dispute_ref: string;
  reason: string;
  reason_code: string;
  card_network: string | null;
  status: string;
  amount: string;
  currency: string;
  evidence_due_at: Date | null;
  representment_notes: string | null;
  representment_submitted_at: Date | null;
  representment_submitted_by: number | null;
  resolution_notes: string | null;
  resolved_at: Date | null;
  resolved_by: number | null;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
  transaction_ref?: string;
  transaction_amount?: string;
  merchant_name?: string;
  merchant_code?: string;
  customer_name?: string;
  customer_email?: string;
  created_by_name?: string;
  representment_submitted_by_name?: string;
  resolved_by_name?: string;
}

export interface ChargebackHistoryRow extends RowDataPacket {
  id: number;
  dispute_id: number;
  from_status: string | null;
  to_status: string;
  reason: string | null;
  changed_by: number | null;
  created_at: Date;
  changed_by_name?: string;
}

export interface ChargebackEvidenceRow extends RowDataPacket {
  id: number;
  uuid: string;
  dispute_id: number;
  file_name: string;
  file_url: string;
  mime_type: string | null;
  description: string | null;
  uploaded_by: number | null;
  created_at: Date;
  uploaded_by_name?: string;
}

export interface ChargebackStatisticsRow extends RowDataPacket {
  total: number;
  open_count: number;
  evidence_required_count: number;
  under_review_count: number;
  representment_count: number;
  won_count: number;
  lost_count: number;
  closed_count: number;
  open_amount: string;
  won_amount: string;
  lost_amount: string;
}
