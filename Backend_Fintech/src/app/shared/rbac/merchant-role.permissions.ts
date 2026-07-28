import { PermissionRepository } from './permission.repository';

const merchantRolePermCache = new Map<string, string[]>();

export async function getMerchantRolePermissions(roleCode: string): Promise<string[]> {
  if (roleCode === 'platform') return [];
  const cached = merchantRolePermCache.get(roleCode);
  if (cached) return cached;

  const repo = new PermissionRepository();
  const perms = await repo.getPermissionCodesForMerchantRole(roleCode);
  merchantRolePermCache.set(roleCode, perms);
  return perms;
}

/** When merchant context active, intersect global permissions with merchant role permissions. */
export function applyMerchantRoleCap(
  globalPermissions: string[],
  merchantRoleCode: string | undefined,
  merchantPermissions: string[],
): string[] {
  if (!merchantRoleCode || merchantRoleCode === 'platform') {
    return globalPermissions;
  }
  if (globalPermissions.includes('*')) {
    return merchantPermissions.length ? merchantPermissions : globalPermissions;
  }
  if (!merchantPermissions.length) {
    return globalPermissions;
  }
  return globalPermissions.filter((p) => merchantPermissions.includes(p));
}

export function filterPermissionsByMerchantRole(
  permissions: string[],
  merchantRoleCode: string,
  merchantPermissions: string[],
): string[] {
  return applyMerchantRoleCap(permissions, merchantRoleCode, merchantPermissions);
}
