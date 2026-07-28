export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface OnboardingStatistics {
  total: number;
  draft: number;
  submitted: number;
  kycPending: number;
  underReview: number;
  approved: number;
  rejected: number;
  goLive: number;
  suspended: number;
  inactive: number;
  pendingOnboarding: number;
}

export interface OnboardingSummary {
  id: number;
  uuid: string;
  applicationRef: string;
  organizationId: number;
  organizationName: string | null;
  merchantId: number | null;
  status: string;
  currentStep: number;
  businessName: string | null;
  legalName: string | null;
  industry: string | null;
  submittedAt: string | null;
  createdAt: string;
}

export interface BusinessInfo {
  businessName: string;
  legalName: string;
  merchantCategory?: string | null;
  industry?: string | null;
  website?: string | null;
  email: string;
  phone?: string | null;
  gstNumber?: string | null;
  panNumber?: string | null;
  cinNumber?: string | null;
  businessType?: string | null;
}

export interface OnboardingAddress {
  id?: number;
  uuid?: string;
  addressType: 'registered' | 'operating';
  line1: string;
  line2?: string | null;
  country: string;
  state?: string | null;
  city: string;
  pincode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface KycDocument {
  id?: number;
  uuid?: string;
  documentType: string;
  fileName: string;
  fileSize?: number | null;
  mimeType?: string | null;
  storagePath?: string | null;
}

export interface BankDetails {
  accountHolder: string;
  accountNumberMasked?: string;
  accountNumber?: string;
  ifsc: string;
  bankName: string;
  branch?: string | null;
  accountType: string;
  verificationStatus: string;
}

export interface SettlementConfig {
  settlementCycle: string;
  settlementCurrency: string;
  settlementMethod: string;
  minSettlementAmount: number;
  reservePct: number;
  rollingReservePct: number;
}

export interface PaymentConfig {
  enableCards: boolean;
  enableUpi: boolean;
  enableNetBanking: boolean;
  enableWallet: boolean;
  enableEmi: boolean;
  enableBnpl: boolean;
  enableQr: boolean;
  enablePaymentLinks: boolean;
  enableSubscriptions: boolean;
}

export interface TimelineEvent {
  id: number;
  uuid: string;
  eventType: string;
  summary: string;
  actorName: string | null;
  createdAt: string;
}

export interface OnboardingDetail extends OnboardingSummary {
  rejectionReason: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  goLiveAt: string | null;
  business: BusinessInfo | null;
  addresses: OnboardingAddress[];
  kycDocuments: KycDocument[];
  bank: BankDetails | null;
  settlement: SettlementConfig | null;
  payment: PaymentConfig | null;
  timeline: TimelineEvent[];
}

export interface OnboardingListResponse {
  items: OnboardingSummary[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}
