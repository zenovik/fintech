export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface ChargebackSummary {
  id: number;
  uuid: string;
  disputeRef: string;
  transactionId: number;
  transactionRef: string | null;
  merchantId: number;
  merchantName: string | null;
  customerId: number | null;
  customerName: string | null;
  reason: string;
  reasonCode: string;
  cardNetwork: string | null;
  status: string;
  amount: number;
  currency: string;
  evidenceDueAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface ChargebackHistoryEntry {
  id: number;
  fromStatus: string | null;
  toStatus: string;
  reason: string | null;
  changedByName: string | null;
  createdAt: string;
}

export interface ChargebackEvidenceEntry {
  id: number;
  uuid: string;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  description: string | null;
  uploadedByName: string | null;
  createdAt: string;
}

export interface ChargebackDetail extends ChargebackSummary {
  transactionAmount: number | null;
  merchantCode: string | null;
  customerEmail: string | null;
  representmentNotes: string | null;
  representmentSubmittedAt: string | null;
  representmentSubmittedByName: string | null;
  resolutionNotes: string | null;
  resolvedByName: string | null;
  createdByName: string | null;
  updatedAt: string;
  history: ChargebackHistoryEntry[];
  evidence: ChargebackEvidenceEntry[];
}

export interface ChargebackListResponse {
  items: ChargebackSummary[];
  stats: {
    total: number;
    open: number;
    evidenceRequired: number;
    underReview: number;
    representmentSubmitted: number;
    won: number;
    lost: number;
    closed: number;
    openAmount: number;
    wonAmount: number;
    lostAmount: number;
  };
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface CreateChargebackPayload {
  transactionId: number;
  reason: string;
  reasonCode?: string;
  cardNetwork?: string;
  amount?: number;
}

export interface AddEvidencePayload {
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  description?: string;
}

export interface RepresentmentPayload {
  notes: string;
}

export interface ResolveChargebackPayload {
  outcome: 'won' | 'lost';
  notes?: string;
}
