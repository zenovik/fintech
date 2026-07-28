export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface TransactionListItem {
  id: number;
  uuid: string;
  transactionRef: string;
  merchant: { id: number; code: string; name: string; initials: string; color: string | null };
  customerName: string | null;
  customerEmail: string | null;
  customerId: number | null;
  amount: number;
  currency: string;
  formattedAmount: string;
  paymentMethod: { typeId: number; detail: string; iconKey: string | null };
  status: { code: string; label: string; badgeColor: string };
  isHighValue: boolean;
  processedAt: string;
}

export interface TransactionStatistics {
  total: number;
  totalVolume: number;
  settled: number;
  pending: number;
  failed: number;
  flagged: number;
  highValue: number;
  refunds: number;
  disputes: number;
}

export interface TransactionDetail extends TransactionListItem {
  description: string | null;
  feeAmount: number;
  netAmount: number | null;
  region: { id: number; code: string | null };
  settledAt: string | null;
  createdAt: string;
  updatedAt: string;
  events: { id: number; eventType: string; eventData: unknown; createdAt: string }[];
  statusHistory: { fromStatus: { code: string; label: string } | null; toStatus: { code: string; label: string }; reason: string | null; createdAt: string }[];
  refunds: { id: number; refundRef: string; amount: number; currency: string; reason: string | null; status: string; processedAt: string | null }[];
  fees: { id: number; feeType: string; amount: number; currency: string; description: string | null }[];
  notes: { id: number; noteText: string; isInternal: boolean; createdAt: string }[];
  attachments: { id: number; fileName: string; fileUrl: string; mimeType: string | null }[];
  disputes: { id: number; disputeRef: string; reason: string; status: string; amount: number; currency: string }[];
  settlement: {
    id: number;
    uuid: string;
    settlementRef: string;
    amount: number;
    currency: string;
    status: string;
    processedAt: string | null;
  } | null;
}

export interface TransactionListResponse {
  items: TransactionListItem[];
  pagination: PaginationMeta;
}

export interface TransactionDispute {
  id: number;
  disputeRef: string;
  transactionId: number;
  transactionRef: string;
  merchantName: string;
  reason: string;
  status: string;
  amount: number;
  currency: string;
}

export interface ExportResult {
  jobId: string;
  status: string;
  format: string;
  rowCount: number;
  message: string;
  downloadUrl?: string;
}
