export interface ApiResponse<T> { success: boolean; data: T; }
export interface RoleListItem {
  id: number; uuid: string; code: string; name: string; description: string | null;
  isSystem: boolean; userCount: number; permissionCount: number; permissionIds?: number[];
  createdAt: string; updatedAt: string;
}
export interface PermissionItem { id: number; uuid: string; code: string; name: string; module: string; description: string | null; }
export interface PermissionListResponse { items: PermissionItem[]; byModule: Record<string, { id: number; code: string; name: string; description: string | null }[]>; }
