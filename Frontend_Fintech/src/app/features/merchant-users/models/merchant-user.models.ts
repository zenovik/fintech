export interface MerchantRole {
  id: number;
  code: string;
  name: string;
  description: string | null;
}

export interface MerchantUserSummary {
  id: number;
  email: string;
  fullName: string;
  merchantId: number;
  merchantName: string | null;
  roleName: string | null;
  roleCode: string | null;
  accessScope: string;
  status: string;
}

export interface MerchantUserDetail extends MerchantUserSummary {
  outletIds: number[];
  defaultOutletId: number | null;
}

export interface MerchantUserListResponse {
  items: MerchantUserSummary[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}
