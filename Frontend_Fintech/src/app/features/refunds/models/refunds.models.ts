export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface RefundSummary {
  id: number;
  uuid: string;
  refundRef: string;
  transactionId: number;
  transactionRef: string | null;
  transactionAmount: number | null;
  merchantId: number;
  merchantName: string | null;
  merchantCode: string | null;
  customerId: number | null;
  customerName: string | null;
  refundType: string;
  amount: number;
  currency: string;
  reason: string | null;
  status: string;
  requestedByName: string | null;
  processedAt: string | null;
  createdAt: string;
}

export interface RefundHistoryEntry {
  id: number;
  fromStatus: string | null;
  toStatus: string;
  reason: string | null;
  changedByName: string | null;
  createdAt: string;
}

export interface RefundDetail extends RefundSummary {
  customerEmail: string | null;
  approvedByName: string | null;
  rejectedByName: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  updatedAt: string;
  history: RefundHistoryEntry[];
}

export interface RefundListResponse {
  items: RefundSummary[];
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    processed: number;
    failed: number;
    pendingAmount: number;
    processedAmount: number;
  };
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface CreateRefundPayload {
  transactionId: number;
  amount: number;
  reason?: string;
}
