import { Request, Response, NextFunction } from 'express';
import { OrganizationRepository } from '../../modules/organizations/repositories/organization.repository';
import { ForbiddenError, UnauthorizedError, ValidationError } from '../exceptions/app.exception';
import { orgContextStorage } from '../context/org-context';

const organizationRepo = new OrganizationRepository();

const ORG_HEADER = 'x-organization-id';

declare global {
  namespace Express {
    interface Request {
      organizationId?: number;
      organizationRoleCode?: string;
    }
  }
}

async function resolveOrgContext(req: Request): Promise<{ organizationId: number; organizationRoleCode: string }> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const headerOrg = req.headers[ORG_HEADER] ?? req.headers[ORG_HEADER.toLowerCase()];
  const headerOrgId = headerOrg ? Number(Array.isArray(headerOrg) ? headerOrg[0] : headerOrg) : undefined;
  const orgIdRaw = headerOrgId && Number.isFinite(headerOrgId) ? headerOrgId : req.user.organizationId;
  const orgId = Number(orgIdRaw);

  if (!orgId || !Number.isFinite(orgId)) {
    throw new ValidationError('Organization context is required');
  }

  const memberships = await organizationRepo.findMembershipsByUserId(req.user.sub);
  const membership = memberships.find((m) => m.id === orgId);

  if (!membership) {
    throw new ForbiddenError('You do not have access to this organization');
  }

  return { organizationId: orgId, organizationRoleCode: membership.roleCode };
}

export function requireOrganization() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = await resolveOrgContext(req);
      req.organizationId = ctx.organizationId;
      req.organizationRoleCode = ctx.organizationRoleCode;
      req.user = {
        ...req.user!,
        organizationId: ctx.organizationId,
        organizationRoleCode: ctx.organizationRoleCode,
      };

      orgContextStorage.run(ctx, () => next());
    } catch (error) {
      next(error);
    }
  };
}

/** Optional org resolution — does not fail when header/JWT org absent. */
export function optionalOrganization() {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        next();
        return;
      }
      const headerOrg = req.headers[ORG_HEADER] ?? req.headers[ORG_HEADER.toLowerCase()];
      const orgIdRaw = req.user.organizationId ?? (Array.isArray(headerOrg) ? headerOrg[0] : headerOrg);
      const orgId = Number(orgIdRaw);
      if (!orgId || !Number.isFinite(orgId)) {
        next();
        return;
      }
      const memberships = await organizationRepo.findMembershipsByUserId(req.user.sub);
      const membership = memberships.find((m) => m.id === orgId);
      if (!membership) {
        next();
        return;
      }
      const ctx = { organizationId: orgId, organizationRoleCode: membership.roleCode };
      req.organizationId = orgId;
      req.organizationRoleCode = membership.roleCode;
      orgContextStorage.run(ctx, () => next());
    } catch (error) {
      next(error);
    }
  };
}
