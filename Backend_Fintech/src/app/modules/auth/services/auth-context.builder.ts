import { PermissionRepository } from '../../../shared/rbac/permission.repository';
import { filterPermissionsByOrgRole } from '../../../shared/rbac/organization-role.permissions';
import { MerchantUserRepository } from '../../merchant-users/repositories/merchant-user.repository';
import { applyMerchantRoleCap, getMerchantRolePermissions } from '../../../shared/rbac/merchant-role.permissions';
import { AuthUserPayload } from '../types/auth.types';

const permissionRepo = new PermissionRepository();
const merchantUserRepo = new MerchantUserRepository();

export async function enrichAuthPayload(
  base: AuthUserPayload,
  organizationId?: number,
): Promise<AuthUserPayload> {
  const orgId = organizationId ?? base.organizationId;
  let globalPermissions = await permissionRepo.getPermissionCodesForUser(base.sub);
  if (base.organizationRoleCode) {
    globalPermissions = filterPermissionsByOrgRole(globalPermissions, base.organizationRoleCode);
  }

  if (!orgId) {
    return { ...base, permissions: globalPermissions.includes('*') ? ['*'] : globalPermissions };
  }

  const membership = await merchantUserRepo.findMembershipsForUser(base.sub, orgId);
  const primary = membership[0];
  if (primary && !globalPermissions.includes('*')) {
    const merchantPerms = await getMerchantRolePermissions(primary.role_code as string);
    globalPermissions = applyMerchantRoleCap(globalPermissions, primary.role_code as string, merchantPerms);
    const outletIds = await merchantUserRepo.getOutletIds(Number(primary.id));
    return {
      ...base,
      organizationId: orgId,
      merchantId: Number(primary.merchant_id),
      merchantRoleCode: primary.role_code as string,
      outletIds,
      permissions: globalPermissions,
    };
  }

  return {
    ...base,
    organizationId: orgId,
    permissions: globalPermissions.includes('*') ? ['*'] : globalPermissions,
  };
}
