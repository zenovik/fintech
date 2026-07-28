import { RowDataPacket } from 'mysql2/promise';
import { SettlementStatus } from '../constants/settlement.constants';

export interface SettlementRow extends RowDataPacket {
  id: number;
  uuid: string;
  settlement_ref: string;
  merchant_id: number;
  merchant_code: string;
  merchant_name: string;
  batch_id: number | null;
  batch_ref: string | null;
  gross_amount: number;
  fee_amount: number;
  adjustment_amount: number;
  amount: number;
  currency: string;
  status: SettlementStatus;
  settlement_cycle: string | null;
  scheduled_at: Date | null;
  processed_at: Date | null;
  bank_transfer_ref: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface SettlementBatchRow extends RowDataPacket {
  id: number;
  uuid: string;
  batch_ref: string;
  status: string;
  total_amount: number;
  settlement_count: number;
  currency: string;
  scheduled_at: Date | null;
  processed_at: Date | null;
  created_at: Date;
}

export interface SettlementTransactionRow extends RowDataPacket {
  id: number;
  transaction_id: number;
  transaction_ref: string;
  amount: number;
  currency: string;
  payment_method_detail: string;
  processed_at: Date;
}

export interface SettlementStatusHistoryRow extends RowDataPacket {
  id: number;
  from_status: string | null;
  to_status: string;
  reason: string | null;
  created_at: Date;
}

export interface SettlementReversalRow extends RowDataPacket {
  id: number;
  uuid: string;
  reversal_ref: string;
  amount: number;
  currency: string;
  reason: string;
  status: string;
  processed_at: Date | null;
  created_at: Date;
}

export interface SettlementFeeRow extends RowDataPacket {
  id: number;
  fee_type: string;
  amount: number;
  currency: string;
  description: string | null;
}

export interface SettlementBankTransferRow extends RowDataPacket {
  id: number;
  uuid: string;
  bank_name: string | null;
  account_masked: string;
  transfer_ref: string | null;
  amount: number;
  currency: string;
  status: string;
  sent_at: Date | null;
  confirmed_at: Date | null;
}

export interface SettlementNoteRow extends RowDataPacket {
  id: number;
  uuid: string;
  note_text: string;
  is_internal: number;
  created_at: Date;
}

export interface SettlementStatisticsRow extends RowDataPacket {
  total: number;
  total_volume: number;
  processed_count: number;
  pending_count: number;
  processing_count: number;
  failed_count: number;
  reversed_count: number;
}

export interface SettlementAdjustmentRow extends RowDataPacket {
  id: number;
  uuid: string;
  adjustment_type: string;
  amount: number;
  currency: string;
  reason: string | null;
}
