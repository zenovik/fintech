export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface QrCodeSummary {
  id: number;
  qrRef: string;
  qrType: string;
  title: string;
  merchantId: number;
  merchantName: string | null;
  customerId: number | null;
  customerName: string | null;
  amount: number | null;
  currency: string;
  allowCustomAmount: boolean;
  scanCount: number;
  status: string;
  totalCollected: number;
  expiresAt: string | null;
  createdAt: string;
}

export interface QrCodeDetail extends QrCodeSummary {
  uuid: string;
  organizationId: number;
  organizationName: string | null;
  description: string | null;
  publicToken: string;
  payUrl: string;
  createdByName: string | null;
  updatedAt: string;
}

export interface QrStats {
  total: number;
  active: number;
  disabled: number;
  totalScans: number;
  totalCollected: number;
}

export interface QrListResponse {
  items: QrCodeSummary[];
  stats: QrStats;
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface CreateQrPayload {
  merchantId: number;
  customerId?: number;
  qrType?: string;
  title: string;
  description?: string;
  amount?: number;
  currency?: string;
  allowCustomAmount?: boolean;
  expiresAt?: string;
}

export interface UpdateQrPayload {
  title?: string;
  description?: string;
  amount?: number;
  currency?: string;
  allowCustomAmount?: boolean;
  expiresAt?: string;
}

export interface QrDownloadResponse {
  dataUrl: string;
  payUrl: string;
}

export interface PublicQrCode {
  title: string;
  description: string | null;
  amount: number | null;
  currency: string;
  allowCustomAmount: boolean;
  qrType: string;
  merchantName: string | null;
  expiresAt: string | null;
}

export interface PublicQrPayPayload {
  amount?: number;
  customerName?: string;
  customerEmail?: string;
  paymentMethodDetail?: string;
}

export interface PublicQrPayResponse {
  transactionId: number;
  transactionRef: string;
  amount: number;
  currency: string;
}
