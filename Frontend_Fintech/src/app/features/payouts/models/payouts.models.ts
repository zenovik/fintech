export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PayoutSummary {
  id: number;
  uuid: string;
  payoutRef: string;
  merchantId: number;
  merchantName: string | null;
  settlementId: number | null;
  settlementRef: string | null;
  bankAccountId: number | null;
  bankName: string | null;
  accountMasked: string | null;
  amount: number;
  feeAmount: number;
  currency: string;
  payoutType: string;
  payoutMethod: string;
  status: string;
  transferRef: string | null;
  scheduledAt: string | null;
  confirmedAt: string | null;
  createdAt: string;
}

export interface PayoutHistoryEntry {
  id: number;
  fromStatus: string | null;
  toStatus: string;
  reason: string | null;
  changedByName: string | null;
  createdAt: string;
}

export interface BankAccountSummary {
  id: number;
  uuid: string;
  merchantId: number;
  merchantName: string | null;
  accountHolder: string;
  bankName: string | null;
  accountNumberMasked: string;
  iban: string | null;
  swiftBic: string | null;
  currency: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface PayoutDetail extends PayoutSummary {
  merchantCode: string | null;
  failureReason: string | null;
  notes: string | null;
  processedAt: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  createdByName: string | null;
  updatedAt: string;
  history: PayoutHistoryEntry[];
}

export interface PayoutListResponse {
  items: PayoutSummary[];
  stats: {
    total: number;
    pending: number;
    scheduled: number;
    processing: number;
    sent: number;
    confirmed: number;
    failed: number;
    cancelled: number;
    pendingAmount: number;
    confirmedAmount: number;
    failedAmount: number;
  };
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface CreatePayoutPayload {
  merchantId: number;
  amount: number;
  bankAccountId?: number;
  settlementId?: number;
  payoutType?: string;
  payoutMethod?: string;
  scheduledAt?: string;
  notes?: string;
  feeAmount?: number;
}

export interface CreateBankAccountPayload {
  merchantId: number;
  accountHolder: string;
  bankName?: string;
  accountNumberMasked: string;
  iban?: string;
  swiftBic?: string;
  currency?: string;
  isPrimary?: boolean;
}
