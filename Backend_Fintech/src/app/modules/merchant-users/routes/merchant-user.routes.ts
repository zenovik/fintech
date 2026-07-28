import { Router } from 'express';
import { MerchantUserController } from '../controllers/merchant-user.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { optionalMerchant } from '../../../shared/middleware/merchant.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import {
  validateBody, validateParams, validateQuery,
  merchantUserListQuerySchema, merchantUserIdParamSchema, createMerchantUserBodySchema,
  inviteMerchantUserBodySchema, updateMerchantUserBodySchema, assignRoleBodySchema,
  assignOutletsBodySchema, resetPasswordBodySchema,
} from '../validators/merchant-user.validator';

const router = Router();
const controller = new MerchantUserController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/me', asyncHandler(controller.me));
router.get('/roles', authorize(PERMISSIONS.MERCHANT_USERS_READ), asyncHandler(controller.listRoles));

router.use(optionalMerchant());

router.get('/', authorize(PERMISSIONS.MERCHANT_USERS_READ), validateQuery(merchantUserListQuerySchema), asyncHandler(controller.list));
router.post('/', authorize(PERMISSIONS.MERCHANT_USERS_WRITE), validateBody(createMerchantUserBodySchema), asyncHandler(controller.create));
router.post('/invite', authorize(PERMISSIONS.MERCHANT_USERS_MANAGE), validateBody(inviteMerchantUserBodySchema), asyncHandler(controller.invite));
router.get('/:id', authorize(PERMISSIONS.MERCHANT_USERS_READ), validateParams(merchantUserIdParamSchema), asyncHandler(controller.getById));
router.put('/:id', authorize(PERMISSIONS.MERCHANT_USERS_WRITE), validateParams(merchantUserIdParamSchema), validateBody(updateMerchantUserBodySchema), asyncHandler(controller.update));
router.post('/:id/activate', authorize(PERMISSIONS.MERCHANT_USERS_MANAGE), validateParams(merchantUserIdParamSchema), asyncHandler(controller.activate));
router.post('/:id/deactivate', authorize(PERMISSIONS.MERCHANT_USERS_MANAGE), validateParams(merchantUserIdParamSchema), asyncHandler(controller.deactivate));
router.put('/:id/role', authorize(PERMISSIONS.MERCHANT_USERS_MANAGE), validateParams(merchantUserIdParamSchema), validateBody(assignRoleBodySchema), asyncHandler(controller.assignRole));
router.put('/:id/outlets', authorize(PERMISSIONS.MERCHANT_USERS_MANAGE), validateParams(merchantUserIdParamSchema), validateBody(assignOutletsBodySchema), asyncHandler(controller.assignOutlets));
router.post('/:id/reset-password', authorize(PERMISSIONS.MERCHANT_USERS_MANAGE), validateParams(merchantUserIdParamSchema), validateBody(resetPasswordBodySchema), asyncHandler(controller.resetPassword));

export { router as merchantUserRoutes };
