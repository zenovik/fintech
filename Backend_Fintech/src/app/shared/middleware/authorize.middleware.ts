import { Request, Response, NextFunction } from 'express';
import { PermissionRepository } from '../rbac/permission.repository';
import { UnauthorizedError, ForbiddenError } from '../exceptions/app.exception';
import { filterPermissionsByOrgRole } from '../rbac/organization-role.permissions';
import { applyMerchantRoleCap, getMerchantRolePermissions } from '../rbac/merchant-role.permissions';

const permissionRepo = new PermissionRepository();

export function authorize(...requiredPermissions: string[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const globalPermissions = await permissionRepo.getPermissionCodesForUser(req.user.sub);
      let userPermissions = req.user.organizationRoleCode
        ? filterPermissionsByOrgRole(globalPermissions, req.user.organizationRoleCode)
        : globalPermissions;

      if (req.merchantRoleCode && req.merchantRoleCode !== 'platform') {
        const merchantPerms = await getMerchantRolePermissions(req.merchantRoleCode);
        userPermissions = applyMerchantRoleCap(userPermissions, req.merchantRoleCode, merchantPerms);
      }

      const allowed =
        userPermissions.includes('*') ||
        requiredPermissions.some((p) => userPermissions.includes(p));
      if (!allowed) {
        throw new ForbiddenError('You do not have permission to perform this action');
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
