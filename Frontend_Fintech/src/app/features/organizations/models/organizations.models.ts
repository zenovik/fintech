export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface OrganizationSummary {
  id: number;
  uuid: string;
  code: string;
  legalName: string;
  displayName: string;
  dbaName: string | null;
  taxId: string | null;
  industry: string | null;
  website: string | null;
  status: string;
  logoUrl: string | null;
  logoInitials: string | null;
  primaryColor: string | null;
  baseCurrency: string;
  timezone: string;
  locale: string;
  primaryRegion: string | null;
  description: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
}

export interface OrganizationMembership {
  id: number;
  uuid: string;
  code: string;
  displayName: string;
  legalName: string;
  status: string;
  logoInitials: string | null;
  primaryColor: string | null;
  isDefault: boolean;
  membershipStatus: string;
  roleCode: string;
  roleName: string;
}

export interface OrganizationAddress {
  id: number;
  addressType: string;
  line1: string;
  line2: string | null;
  city: string;
  stateProvince: string | null;
  postalCode: string | null;
  countryCode: string;
  isPrimary: boolean;
}

export interface OrganizationContact {
  id: number;
  contactType: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  jobTitle: string | null;
  isPrimary: boolean;
}

export interface OrganizationDomain {
  id: number;
  domain: string;
  isPrimary: boolean;
  isVerified: boolean;
  status: string;
  verifiedAt: string | null;
  createdAt: string;
}

export interface OrganizationMember {
  id: number;
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  orgRoleId: number;
  roleCode: string;
  roleName: string;
  status: string;
  isDefault: boolean;
  joinedAt: string | null;
  createdAt: string;
}

export interface OrganizationBranding {
  id: number;
  companyName: string;
  logoUrl: string | null;
  logoInitials: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  faviconUrl: string | null;
}

export interface OrganizationApiKey {
  id: number;
  name: string;
  keyPrefix: string;
  maskedKey: string;
  environment: string;
  status: string;
  lastUsedAt: string | null;
  createdAt: string;
  secret?: string;
}

export interface OrganizationBilling {
  id: number;
  planCode: string;
  planName: string;
  billingEmail: string | null;
  billingCycle: string;
  status: string;
  currency: string;
  amount: number;
  nextBillingAt: string | null;
  taxExempt: boolean;
  paymentMethodLast4: string | null;
  paymentMethodBrand: string | null;
}

export interface OrganizationRole {
  id: number;
  code: string;
  name: string;
  description: string | null;
}

export interface OrganizationDetail extends OrganizationSummary {
  addresses: OrganizationAddress[];
  contacts: OrganizationContact[];
  domains: OrganizationDomain[];
  members: OrganizationMember[];
  branding: OrganizationBranding | null;
  preferences: Record<string, unknown>;
  apiKeys: OrganizationApiKey[];
  billing: OrganizationBilling | null;
}

export interface OrganizationListResponse {
  items: OrganizationSummary[];
  total: number;
  page: number;
  pageSize: number;
  stats: { total: number; active: number; pending: number; archived: number };
}

export interface OrganizationStats {
  total: number;
  active: number;
  pending: number;
  archived: number;
}
