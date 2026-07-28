export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PaymentLinkStats {
  total: number;
  active: number;
  disabled: number;
  expired: number;
  totalCollected: number;
  totalUsage: number;
  conversionRate: number;
}

export interface PaymentLinkSummary {
  id: number;
  uuid: string;
  organizationId: number;
  organizationName: string | null;
  merchantId: number;
  merchantName: string | null;
  customerId: number | null;
  customerName: string | null;
  linkRef: string;
  title: string;
  description: string | null;
  amount: number | null;
  currency: string;
  allowCustomAmount: boolean;
  expiresAt: string | null;
  maxUsage: number | null;
  currentUsage: number;
  status: string;
  publicToken: string;
  publicUrl: string;
  totalCollected: number;
  createdAt: string;
}

export interface PaymentLinkPayment {
  id: number;
  transactionId: number;
  transactionRef: string | null;
  transactionStatus: string | null;
  paidAmount: number;
  createdAt: string;
}

export interface PaymentLinkDetail extends PaymentLinkSummary {
  organizationCode: string | null;
  merchantCode: string | null;
  customerEmail: string | null;
  redirectUrl: string | null;
  successUrl: string | null;
  cancelUrl: string | null;
  createdBy: number | null;
  createdByName: string | null;
  updatedBy: number | null;
  updatedByName: string | null;
  updatedAt: string;
  payments: PaymentLinkPayment[];
}

export interface PaymentLinkListResponse {
  items: PaymentLinkSummary[];
  stats: PaymentLinkStats;
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface CreatePaymentLinkPayload {
  merchantId: number;
  customerId?: number;
  title: string;
  description?: string;
  amount?: number;
  currency?: string;
  allowCustomAmount?: boolean;
  expiresAt?: string;
  maxUsage?: number;
  redirectUrl?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface UpdatePaymentLinkPayload extends Partial<CreatePaymentLinkPayload> {}

export interface QrCodeResponse {
  dataUrl: string;
  publicUrl: string;
}

export interface PublicPaymentLink {
  title: string;
  description: string | null;
  amount: number | null;
  currency: string;
  allowCustomAmount: boolean;
  merchantName: string | null;
  expiresAt: string | null;
  maxUsage: number | null;
  currentUsage: number;
  successUrl: string | null;
  cancelUrl: string | null;
}

export interface PublicPayPayload {
  amount?: number;
  customerName?: string;
  customerEmail?: string;
  paymentMethodDetail?: string;
}

export interface PublicPayResponse {
  transactionId: number;
  transactionRef: string;
  amount: number;
  currency: string;
  successUrl: string | null;
  redirectUrl: string | null;
}
