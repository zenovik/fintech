import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import { validateBody, validateParams, validateQuery } from '../../../shared/validators/zod-validator';
import {
  cancelBodySchema, captureBodySchema, createPaymentBodySchema, createSessionBodySchema,
  idParamSchema, merchantIdParamSchema, customerIdParamSchema, paymentListQuerySchema, refundBodySchema,
} from '../dto/payment.dto';

const router = Router();
const controller = new PaymentController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/webhooks/deliveries', authorize(PERMISSIONS.PAYMENTS_READ), asyncHandler(controller.webhookDeliveries));
router.get('/orders', authorize(PERMISSIONS.PAYMENTS_READ), asyncHandler(controller.listOrders));
router.get('/orders/:id', authorize(PERMISSIONS.PAYMENTS_READ), validateParams(idParamSchema), asyncHandler(controller.getOrder));
router.post('/sessions', authorize(PERMISSIONS.PAYMENTS_WRITE), validateBody(createSessionBodySchema), asyncHandler(controller.createSession));
router.get('/sessions/:id', authorize(PERMISSIONS.PAYMENTS_READ), validateParams(idParamSchema), asyncHandler(controller.getSession));
router.get('/merchant-config/:merchantId', authorize(PERMISSIONS.PAYMENTS_READ), validateParams(merchantIdParamSchema), asyncHandler(controller.merchantConfig));
router.get('/customers/:customerId/profile', authorize(PERMISSIONS.PAYMENTS_READ), validateParams(customerIdParamSchema), asyncHandler(controller.customerProfile));

router.get('/', authorize(PERMISSIONS.PAYMENTS_READ), validateQuery(paymentListQuerySchema), asyncHandler(controller.list));
router.post('/', authorize(PERMISSIONS.PAYMENTS_WRITE), validateBody(createPaymentBodySchema), asyncHandler(controller.create));
router.get('/:id', authorize(PERMISSIONS.PAYMENTS_READ), validateParams(idParamSchema), asyncHandler(controller.getById));
router.get('/:id/timeline', authorize(PERMISSIONS.PAYMENTS_READ), validateParams(idParamSchema), asyncHandler(controller.timeline));
router.post('/:id/authorize', authorize(PERMISSIONS.PAYMENTS_CAPTURE), validateParams(idParamSchema), asyncHandler(controller.authorize));
router.post('/:id/capture', authorize(PERMISSIONS.PAYMENTS_CAPTURE), validateParams(idParamSchema), validateBody(captureBodySchema), asyncHandler(controller.capture));
router.post('/:id/cancel', authorize(PERMISSIONS.PAYMENTS_MANAGE), validateParams(idParamSchema), validateBody(cancelBodySchema), asyncHandler(controller.cancel));
router.post('/:id/refund', authorize(PERMISSIONS.PAYMENTS_REFUND), validateParams(idParamSchema), validateBody(refundBodySchema), asyncHandler(controller.refund));
router.post('/:id/retry', authorize(PERMISSIONS.PAYMENTS_MANAGE), validateParams(idParamSchema), asyncHandler(controller.retry));
router.post('/:id/expire', authorize(PERMISSIONS.PAYMENTS_MANAGE), validateParams(idParamSchema), asyncHandler(controller.expire));

export { router as paymentRoutes };
