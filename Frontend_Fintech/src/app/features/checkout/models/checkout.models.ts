export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  redirectUrl?: string;
  canRetry?: boolean;
}

export interface CheckoutBranding {
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  buttonStyle: string;
  borderRadius: string;
  supportEmail?: string | null;
  supportPhone?: string | null;
  termsUrl?: string | null;
  privacyUrl?: string | null;
  merchantName?: string | null;
  merchantAddress?: string | null;
  brandBannerUrl?: string | null;
  darkModeDefault?: boolean;
}

export interface CheckoutRedirectUrls {
  success?: string | null;
  failure?: string | null;
  cancel?: string | null;
  pending?: string | null;
  return?: string | null;
}

export interface PublicCheckout {
  checkoutRef: string;
  status: string;
  amount: number;
  currency: string;
  locale: string;
  mode: 'hosted' | 'embed' | 'popup';
  merchantName: string;
  intentStatus: string;
  intentRef: string;
  expiresAt: string;
  retryCount: number;
  maxRetries: number;
  lastFailureReason?: string | null;
  branding: CheckoutBranding;
  paymentMethods: string[];
  savedMethods: unknown[];
  redirectUrls: CheckoutRedirectUrls;
}

export interface CheckoutPayPayload {
  paymentMethodCode: string;
  amount?: number;
  customerEmail?: string;
  customerPhone?: string;
  billingAddress?: Record<string, string>;
  shippingAddress?: Record<string, string>;
}

export interface CheckoutPayResult {
  status: string;
  intent: { intentRef: string; status: string };
  transactionId?: number;
  redirectUrl?: string | null;
}

export interface CheckoutSessionSummary {
  id: number;
  checkoutRef: string;
  status: string;
  amount: number;
  currency: string;
  mode: string;
  merchantId: number;
  paymentIntentId: number;
  intentRef: string;
  intentStatus: string;
  retryCount: number;
  expiresAt: string;
  completedAt?: string | null;
  createdAt: string;
}

export interface CheckoutSessionListResponse {
  items: CheckoutSessionSummary[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface CheckoutSessionEvent {
  id: number;
  event_type: string;
  payment_method_code?: string | null;
  metadata?: string | null;
  created_at: string;
}

export interface CheckoutSessionDetail {
  session: CheckoutSessionSummary;
  events: CheckoutSessionEvent[];
}

export interface CreateCheckoutSessionPayload {
  merchantId: number;
  amount: number;
  currency?: string;
  customerId?: number;
  merchantOrderId?: string;
  description?: string;
  paymentMethodCode?: string;
  expiryMinutes?: number;
  locale?: string;
  themeId?: number;
  mode?: 'hosted' | 'embed' | 'popup';
  returnUrl?: string;
  cancelUrl?: string;
  successUrl?: string;
  failureUrl?: string;
  pendingUrl?: string;
  webhookUrl?: string;
  customerEmail?: string;
  customerPhone?: string;
  merchantMetadata?: Record<string, unknown>;
}

export interface CreateCheckoutSessionResult {
  checkoutSessionId: number;
  checkoutRef: string;
  clientSecret: string;
  recoveryToken: string;
  hostedCheckoutUrl: string;
  paymentIntentId: number;
  paymentIntentRef: string;
  expiresAt: string;
  mode: string;
}

export interface CheckoutTheme {
  id: number;
  code: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  buttonStyle: string;
  borderRadius: string;
}

export interface CheckoutAnalytics {
  daily: Array<Record<string, unknown>>;
  summary: Array<{ status: string; cnt: number }>;
  events: Array<{ event_type: string; cnt: number }>;
}

export interface UpdateBrandingPayload {
  themeId?: number;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  buttonStyle?: string;
  borderRadius?: string;
  supportEmail?: string;
  supportPhone?: string;
  termsUrl?: string;
  privacyUrl?: string;
  merchantName?: string;
  merchantAddress?: string;
  brandBannerUrl?: string;
  darkModeDefault?: boolean;
}
