export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface SubscriptionPlan {
  id: number;
  planCode: string;
  merchantId: number;
  merchantName: string | null;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billingInterval: string;
  trialDays: number;
  status: string;
  createdAt: string;
}

export interface SubscriptionSummary {
  id: number;
  subscriptionRef: string;
  merchantId: number;
  merchantName: string | null;
  customerId: number;
  customerName: string | null;
  planId: number;
  planName: string;
  planPrice: number;
  currency: string;
  billingInterval: string;
  status: string;
  startDate: string;
  endDate: string | null;
  nextBillingDate: string | null;
  renewalCount: number;
  createdAt: string;
}

export interface SubscriptionDetail extends SubscriptionSummary {
  organizationId: number;
  customerEmail: string | null;
  trialEndDate: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  paymentLink: {
    id: number;
    linkRef: string | null;
    publicUrl: string | null;
    status: string | null;
  } | null;
  updatedAt: string;
}

export interface SubscriptionStats {
  total: number;
  active: number;
  paused: number;
  cancelled: number;
  failed: number;
  renewed: number;
  mrrEstimate: number;
}

export interface SubscriptionListResponse {
  items: SubscriptionSummary[];
  stats: SubscriptionStats;
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface PlanListResponse {
  items: SubscriptionPlan[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface CreatePlanPayload {
  merchantId: number;
  name: string;
  description?: string;
  price: number;
  currency?: string;
  billingInterval?: string;
  trialDays?: number;
}

export interface CreateSubscriptionPayload {
  merchantId: number;
  customerId: number;
  planId: number;
  startDate?: string;
}
