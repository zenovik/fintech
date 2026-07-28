import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, ValidationError } from '../exceptions/app.exception';
import { getOrganizationId } from '../context/org-context';
import { merchantContextStorage, MerchantContextStore } from '../context/merchant-context';
import { MerchantUserRepository } from '../../modules/merchant-users/repositories/merchant-user.repository';

const MERCHANT_HEADER = 'x-merchant-id';
const OUTLET_HEADER = 'x-outlet-id';
const merchantUserRepo = new MerchantUserRepository();

declare global {
  namespace Express {
    interface Request {
      merchantId?: number;
      merchantRoleCode?: string;
      merchantUserId?: number;
      merchantAccessScope?: 'single' | 'multiple' | 'all';
      accessibleOutletIds?: number[];
    }
  }
}

async function resolveMerchantContext(
  req: Request,
  merchantIdRaw: number,
  outletIdRaw?: number,
): Promise<MerchantContextStore> {
  if (!req.user) throw new ForbiddenError('Authentication required');

  const orgId = getOrganizationId() ?? req.organizationId;
  if (!orgId) throw new ValidationError('Organization context is required');

  const membership = await merchantUserRepo.findMembership(req.user.sub, merchantIdRaw, orgId);
  if (!membership) {
    const isPlatform = await merchantUserRepo.isPlatformMerchantAccess(req.user.sub, merchantIdRaw, orgId);
    if (!isPlatform) {
      throw new ForbiddenError('You do not have access to this merchant');
    }
    const outletIds = outletIdRaw
      ? [outletIdRaw]
      : await merchantUserRepo.listOutletIdsForMerchant(merchantIdRaw);
    return {
      merchantId: merchantIdRaw,
      merchantRoleCode: 'platform',
      merchantUserId: 0,
      accessScope: 'all',
      outletIds,
      defaultOutletId: outletIdRaw,
    };
  }

  let outletIds = membership.outletIds;
  if (membership.accessScope === 'all') {
    outletIds = await merchantUserRepo.listOutletIdsForMerchant(merchantIdRaw);
  }
  if (outletIdRaw && !outletIds.includes(outletIdRaw)) {
    throw new ForbiddenError('You do not have access to this outlet');
  }

  return {
    merchantId: merchantIdRaw,
    merchantRoleCode: membership.roleCode,
    merchantUserId: membership.merchantUserId,
    accessScope: membership.accessScope,
    outletIds,
    defaultOutletId: outletIdRaw ?? membership.defaultOutletId ?? undefined,
  };
}

export function requireMerchant() {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
  const headerMerchant = req.headers[MERCHANT_HEADER] ?? req.headers[MERCHANT_HEADER.toLowerCase()];
  const headerMerchantId = headerMerchant ? Number(Array.isArray(headerMerchant) ? headerMerchant[0] : headerMerchant) : undefined;
  const merchantId = (headerMerchantId && Number.isFinite(headerMerchantId) ? headerMerchantId : req.user?.merchantId) as number;
  if (!merchantId || !Number.isFinite(merchantId)) {
    throw new ValidationError('Merchant context is required');
  }
  const headerOutlet = req.headers[OUTLET_HEADER] ?? req.headers[OUTLET_HEADER.toLowerCase()];
  const outletHeaderId = headerOutlet ? Number(Array.isArray(headerOutlet) ? headerOutlet[0] : headerOutlet) : undefined;
  const outletRaw = outletHeaderId && Number.isFinite(outletHeaderId)
    ? outletHeaderId
    : (req.user?.outletIds?.[0]);
      const ctx = await resolveMerchantContext(req, merchantId, outletRaw);
      req.merchantId = ctx.merchantId;
      req.merchantRoleCode = ctx.merchantRoleCode;
      req.merchantUserId = ctx.merchantUserId;
      req.merchantAccessScope = ctx.accessScope;
      req.accessibleOutletIds = ctx.outletIds;
      merchantContextStorage.run(ctx, () => next());
    } catch (error) {
      next(error);
    }
  };
}

export function optionalMerchant() {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const headerMerchant = req.headers[MERCHANT_HEADER] ?? req.headers[MERCHANT_HEADER.toLowerCase()];
      const merchantId = Number(Array.isArray(headerMerchant) ? headerMerchant[0] : headerMerchant);
      if (!merchantId || !Number.isFinite(merchantId)) {
        next();
        return;
      }
      const headerOutlet = req.headers[OUTLET_HEADER] ?? req.headers[OUTLET_HEADER.toLowerCase()];
      const outletRaw = headerOutlet ? Number(Array.isArray(headerOutlet) ? headerOutlet[0] : headerOutlet) : undefined;
      const ctx = await resolveMerchantContext(req, merchantId, outletRaw);
      req.merchantId = ctx.merchantId;
      req.merchantRoleCode = ctx.merchantRoleCode;
      req.merchantUserId = ctx.merchantUserId;
      req.merchantAccessScope = ctx.accessScope;
      req.accessibleOutletIds = ctx.outletIds;
      merchantContextStorage.run(ctx, () => next());
    } catch {
      next();
    }
  };
}
