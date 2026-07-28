export interface OutletSummary {
  id: number;
  outletCode: string;
  outletName: string;
  merchantId: number;
  merchantName: string | null;
  organizationId: number;
  status: string;
  city: string | null;
  state: string | null;
  isPrimary: boolean;
  branchType: string;
}

export interface OutletDetail extends OutletSummary {
  storeNumber: string | null;
  phone: string | null;
  email: string | null;
  timezone: string;
  currency: string;
  addressLine1: string | null;
  pincode: string | null;
  notes: string | null;
}

export interface OutletListResponse {
  items: OutletSummary[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}
