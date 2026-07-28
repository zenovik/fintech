export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface CustomerSummary {
  id: number;
  uuid: string;
  customerCode: string;
  organizationId: number;
  organizationName: string | null;
  primaryMerchantId: number | null;
  merchantName: string | null;
  customerType: string;
  firstName: string;
  lastName: string | null;
  displayName: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  status: string;
  kycStatus: string;
  riskLevel: string;
  totalSpent: number;
  transactionCount: number;
  lastTransactionAt: string | null;
  createdAt: string;
}

export interface CustomerAddress {
  id: number;
  uuid: string;
  addressType: string;
  line1: string;
  line2: string | null;
  city: string;
  stateProvince: string | null;
  postalCode: string | null;
  countryCode: string;
  isPrimary: boolean;
}

export interface CustomerMerchantLink {
  id: number;
  merchantId: number;
  merchantCode?: string;
  displayName?: string;
  status?: string;
  transactionCount: number;
  totalSpent: number;
  firstTransactionAt: string | null;
  lastTransactionAt: string | null;
}

export interface CustomerTransaction {
  id: number;
  uuid: string;
  transactionRef: string;
  amount: number;
  currency: string;
  paymentMethodDetail: string;
  status: { code: string; label: string };
  merchantId: number;
  merchantName: string | null;
  processedAt: string;
  settledAt: string | null;
}

export interface CustomerDetail extends CustomerSummary {
  notes: string | null;
  region: { id: number; code?: string; name?: string } | null;
  addresses: CustomerAddress[];
  merchants: CustomerMerchantLink[];
  updatedAt: string;
}

export interface CustomerListResponse {
  items: CustomerSummary[];
  stats: {
    total: number;
    active: number;
    inactive: number;
    blocked: number;
    pending: number;
    verifiedKyc: number;
    highRisk: number;
  };
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export type CreateCustomerPayload = Omit<{
  primaryMerchantId?: number;
  customerType?: string;
  firstName: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  regionId?: number;
  kycStatus?: string;
  riskLevel?: string;
  status?: string;
  notes?: string;
  addresses?: Array<{
    addressType?: string;
    line1: string;
    line2?: string;
    city: string;
    stateProvince?: string;
    postalCode?: string;
    countryCode?: string;
    isPrimary?: boolean;
  }>;
}, never>;

export type UpdateCustomerPayload = Partial<CreateCustomerPayload>;
