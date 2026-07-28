export interface ApiResponse<T> { success: boolean; data: T; message?: string; }

export interface PaginationMeta { page: number; pageSize: number; total: number; totalPages: number; }

export interface SettlementListItem {
  id: number;
  uuid: string;
  settlementRef: string;
  merchant: { id: number; code: string; name: string };
  batch: { id: number; batchRef: string | null } | null;
  grossAmount: number;
  feeAmount: number;
  adjustmentAmount: number;
  amount: number;
  currency: string;
  formattedAmount: string;
  status: string;
  settlementCycle: string | null;
  scheduledAt: string | null;
  processedAt: string | null;
  bankTransferRef: string | null;
  createdAt: string;
}

export interface SettlementStatistics {
  total: number;
  totalVolume: number;
  processed: number;
  pending: number;
  processing: number;
  failed: number;
  reversed: number;
}

export interface SettlementBatch {
  id: number;
  uuid: string;
  batchRef: string;
  status: string;
  totalAmount: number;
  settlementCount: number;
  currency: string;
  scheduledAt: string | null;
  processedAt: string | null;
  createdAt: string;
}

export interface SettlementDetail extends SettlementListItem {
  updatedAt: string;
  transactions: { id: number; transactionId: number; transactionRef: string; amount: number; currency: string; paymentMethodDetail: string; processedAt: string }[];
  statusHistory: { id: number; fromStatus: string | null; toStatus: string; reason: string | null; createdAt: string }[];
  reversals: { id: number; reversalRef: string; amount: number; currency: string; reason: string; status: string; processedAt: string | null }[];
  fees: { id: number; feeType: string; amount: number; currency: string; description: string | null }[];
  bankTransfers: { id: number; bankName: string | null; accountMasked: string; transferRef: string | null; amount: number; status: string }[];
  notes: { id: number; noteText: string; isInternal: boolean; createdAt: string }[];
  adjustments: { id: number; adjustmentType: string; amount: number; currency: string; reason: string | null }[];
}

export interface SettlementListResponse { items: SettlementListItem[]; pagination: PaginationMeta; }
