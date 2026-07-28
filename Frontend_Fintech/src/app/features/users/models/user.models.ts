export interface ApiResponse<T> { success: boolean; data: T; message?: string; }
export interface PaginationMeta { page: number; pageSize: number; total: number; totalPages: number; }

export interface UserRole { id: number; name: string; }

export interface UserListItem {
  id: number; uuid: string; email: string; firstName: string; lastName: string; fullName: string;
  phoneNumber: string | null; status: string; mfaEnabled: boolean; lastLoginAt: string | null;
  createdAt: string; roles: UserRole[]; roleIds: number[];
}

export interface UserDetail extends UserListItem {
  updatedAt: string; permissions: string[];
  activity: { uuid: string; action: string; resourceType: string | null; resourceId: string | null; ipAddress: string | null; createdAt: string }[];
  loginHistory: { email: string; ipAddress: string | null; success: boolean; failureReason: string | null; createdAt: string }[];
}

export interface UserListResponse { items: UserListItem[]; pagination: PaginationMeta; }
