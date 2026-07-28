import { Router } from 'express';
import { RefundController } from '../controllers/refund.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import { validateBody, validateParams, validateQuery } from '../validators/refunds.validator';
import {
  createRefundBodySchema,
  refundIdParamSchema,
  refundListQuerySchema,
  rejectRefundBodySchema,
} from '../dto';

const router = Router();
const controller = new RefundController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/statistics', authorize(PERMISSIONS.REFUNDS_READ), asyncHandler(controller.statistics));
router.get('/', authorize(PERMISSIONS.REFUNDS_READ), validateQuery(refundListQuerySchema), asyncHandler(controller.list));
router.post('/', authorize(PERMISSIONS.REFUNDS_WRITE), validateBody(createRefundBodySchema), asyncHandler(controller.create));
router.get('/:id/history', authorize(PERMISSIONS.REFUNDS_READ), validateParams(refundIdParamSchema), asyncHandler(controller.history));
router.get('/:id', authorize(PERMISSIONS.REFUNDS_READ), validateParams(refundIdParamSchema), asyncHandler(controller.getById));
router.post('/:id/approve', authorize(PERMISSIONS.REFUNDS_APPROVE), validateParams(refundIdParamSchema), asyncHandler(controller.approve));
router.post('/:id/reject', authorize(PERMISSIONS.REFUNDS_APPROVE), validateParams(refundIdParamSchema), validateBody(rejectRefundBodySchema), asyncHandler(controller.reject));

export { router as refundRoutes };
