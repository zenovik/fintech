import { Router } from 'express';
import { PaymentLinkController } from '../controllers/payment-link.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import { validateBody, validateParams, validateQuery } from '../validators/payment-links.validator';
import {
  createPaymentLinkBodySchema,
  paymentLinkIdParamSchema,
  paymentLinkListQuerySchema,
  updatePaymentLinkBodySchema,
} from '../dto';

const router = Router();
const controller = new PaymentLinkController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/statistics', authorize(PERMISSIONS.PAYMENT_LINKS_READ), asyncHandler(controller.statistics));
router.get('/', authorize(PERMISSIONS.PAYMENT_LINKS_READ), validateQuery(paymentLinkListQuerySchema), asyncHandler(controller.list));
router.post('/', authorize(PERMISSIONS.PAYMENT_LINKS_WRITE), validateBody(createPaymentLinkBodySchema), asyncHandler(controller.create));
router.get('/:id/analytics', authorize(PERMISSIONS.PAYMENT_LINKS_READ), validateParams(paymentLinkIdParamSchema), asyncHandler(controller.analytics));
router.get('/:id/visits', authorize(PERMISSIONS.PAYMENT_LINKS_READ), validateParams(paymentLinkIdParamSchema), asyncHandler(controller.visits));
router.post('/:id/clone', authorize(PERMISSIONS.PAYMENT_LINKS_WRITE), validateParams(paymentLinkIdParamSchema), asyncHandler(controller.clone));
router.get('/:id/qr', authorize(PERMISSIONS.PAYMENT_LINKS_READ), validateParams(paymentLinkIdParamSchema), asyncHandler(controller.qrCode));
router.post('/:id/enable', authorize(PERMISSIONS.PAYMENT_LINKS_MANAGE), validateParams(paymentLinkIdParamSchema), asyncHandler(controller.enable));
router.post('/:id/disable', authorize(PERMISSIONS.PAYMENT_LINKS_MANAGE), validateParams(paymentLinkIdParamSchema), asyncHandler(controller.disable));
router.post('/:id/expire', authorize(PERMISSIONS.PAYMENT_LINKS_MANAGE), validateParams(paymentLinkIdParamSchema), asyncHandler(controller.expire));
router.post('/:id/regenerate-token', authorize(PERMISSIONS.PAYMENT_LINKS_MANAGE), validateParams(paymentLinkIdParamSchema), asyncHandler(controller.regenerateToken));
router.get('/:id', authorize(PERMISSIONS.PAYMENT_LINKS_READ), validateParams(paymentLinkIdParamSchema), asyncHandler(controller.getById));
router.put('/:id', authorize(PERMISSIONS.PAYMENT_LINKS_WRITE), validateParams(paymentLinkIdParamSchema), validateBody(updatePaymentLinkBodySchema), asyncHandler(controller.update));

export { router as paymentLinkRoutes };
