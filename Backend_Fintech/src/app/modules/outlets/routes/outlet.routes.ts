import { Router } from 'express';
import { OutletController } from '../controllers/outlet.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { optionalMerchant } from '../../../shared/middleware/merchant.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import {
  validateBody, validateParams, validateQuery,
  createOutletBodySchema, outletIdParamSchema, outletListQuerySchema, updateOutletBodySchema,
} from '../validators/outlet.validator';

const router = Router();
const controller = new OutletController();

router.use(authenticate);
router.use(requireOrganization());
router.use(optionalMerchant());

router.get('/', authorize(PERMISSIONS.OUTLETS_READ), validateQuery(outletListQuerySchema), asyncHandler(controller.list));
router.post('/', authorize(PERMISSIONS.OUTLETS_WRITE), validateBody(createOutletBodySchema), asyncHandler(controller.create));
router.get('/:id', authorize(PERMISSIONS.OUTLETS_READ), validateParams(outletIdParamSchema), asyncHandler(controller.getById));
router.put('/:id', authorize(PERMISSIONS.OUTLETS_WRITE), validateParams(outletIdParamSchema), validateBody(updateOutletBodySchema), asyncHandler(controller.update));
router.post('/:id/activate', authorize(PERMISSIONS.OUTLETS_MANAGE), validateParams(outletIdParamSchema), asyncHandler(controller.activate));
router.post('/:id/deactivate', authorize(PERMISSIONS.OUTLETS_MANAGE), validateParams(outletIdParamSchema), asyncHandler(controller.deactivate));

export { router as outletRoutes };
