import {
  MerchantBusinessType,
  MerchantKycStatus,
  MerchantRiskLevel,
  MerchantStatus,
} from '../constants/merchant.constants';

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

export interface MerchantListItem {
  id: number;
  uuid: string;
  merchantCode: string;
  legalName: string;
  displayName: string;
  logoInitials: string | null;
  logoColor: string | null;
  businessType: MerchantBusinessType | null;
  kycStatus: MerchantKycStatus;
  riskLevel: MerchantRiskLevel;
  status: MerchantStatus;
  region: { id: number; code?: string; name?: string };
  dailyVolume: number;
  walletBalance: number;
  createdAt: string;
}

export interface MerchantStatistics {
  total: number;
  active: number;
  pending: number;
  suspended: number;
  verifiedKyc: number;
  pendingKyc: number;
  highRisk: number;
}

export interface MerchantContact {
  id: number;
  uuid: string;
  contactType: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  jobTitle: string | null;
  isPrimary: boolean;
}

export interface MerchantAddress {
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

export interface MerchantDocument {
  id: number;
  uuid: string;
  documentType: string;
  fileName: string;
  fileUrl: string | null;
  status: string;
  createdAt: string;
}

export interface MerchantApiKey {
  id: number;
  uuid: string;
  keyName: string;
  apiKeyPrefix: string;
  environment: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface MerchantDetail extends MerchantListItem {
  businessCategory: string | null;
  entityType: string | null;
  registrationNumber: string | null;
  website: string | null;
  monthlyTpvEstimate: number | null;
  onboardedAt: string | null;
  updatedAt: string;
  contacts: MerchantContact[];
  addresses: MerchantAddress[];
  documents: MerchantDocument[];
  apiKeys: MerchantApiKey[];
  tags: { id: number; name: string; color: string | null }[];
}

export interface MerchantListResponse {
  items: MerchantListItem[];
  pagination: PaginationMeta;
}

export interface MerchantTransaction {
  id: number;
  transactionRef: string;
  amount: number;
  currency: string;
  paymentMethodDetail: string;
  status: { code: string; label: string };
  processedAt: string;
  settledAt: string | null;
}

export interface CreateMerchantPayload {
  legalName: string;
  displayName: string;
  businessType?: MerchantBusinessType;
  entityType?: string;
  registrationNumber?: string;
  website?: string;
  monthlyTpvEstimate?: number;
  regionId: number;
  kycStatus?: MerchantKycStatus;
  riskLevel?: MerchantRiskLevel;
  status?: MerchantStatus;
  contacts?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    jobTitle?: string;
    isPrimary?: boolean;
  }[];
  addresses?: {
    line1: string;
    line2?: string;
    city: string;
    stateProvince?: string;
    postalCode?: string;
    countryCode?: string;
    isPrimary?: boolean;
  }[];
}
