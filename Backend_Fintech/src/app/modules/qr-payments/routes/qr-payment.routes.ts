import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { QrPaymentController, PublicQrPaymentController } from '../controllers/qr-payment.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import { validateBody, validateParams, validateQuery } from '../validators/qr-payments.validator';
import { createQrBodySchema, publicQrPayBodySchema, publicTokenParamSchema, qrIdParamSchema, qrListQuerySchema, updateQrBodySchema } from '../dto';

const router = Router();
const controller = new QrPaymentController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/templates', authorize(PERMISSIONS.QR_PAYMENTS_READ), asyncHandler(controller.templates));
router.get('/categories', authorize(PERMISSIONS.QR_PAYMENTS_READ), asyncHandler(controller.categories));
router.post('/bulk', authorize(PERMISSIONS.QR_PAYMENTS_WRITE), asyncHandler(controller.bulkCreate));
router.get('/statistics', authorize(PERMISSIONS.QR_PAYMENTS_READ), asyncHandler(controller.statistics));
router.get('/', authorize(PERMISSIONS.QR_PAYMENTS_READ), validateQuery(qrListQuerySchema), asyncHandler(controller.list));
router.post('/', authorize(PERMISSIONS.QR_PAYMENTS_WRITE), validateBody(createQrBodySchema), asyncHandler(controller.create));
router.get('/:id/download/svg', authorize(PERMISSIONS.QR_PAYMENTS_READ), validateParams(qrIdParamSchema), asyncHandler(controller.downloadSvg));
router.get('/:id/download', authorize(PERMISSIONS.QR_PAYMENTS_READ), validateParams(qrIdParamSchema), asyncHandler(controller.download));
router.get('/:id/scan-history', authorize(PERMISSIONS.QR_PAYMENTS_READ), validateParams(qrIdParamSchema), asyncHandler(controller.scanHistory));
router.post('/:id/clone', authorize(PERMISSIONS.QR_PAYMENTS_WRITE), validateParams(qrIdParamSchema), asyncHandler(controller.clone));
router.post('/:id/archive', authorize(PERMISSIONS.QR_PAYMENTS_MANAGE), validateParams(qrIdParamSchema), asyncHandler(controller.archive));
router.post('/:id/enable', authorize(PERMISSIONS.QR_PAYMENTS_MANAGE), validateParams(qrIdParamSchema), asyncHandler(controller.enable));
router.post('/:id/disable', authorize(PERMISSIONS.QR_PAYMENTS_MANAGE), validateParams(qrIdParamSchema), asyncHandler(controller.disable));
router.post('/:id/regenerate', authorize(PERMISSIONS.QR_PAYMENTS_MANAGE), validateParams(qrIdParamSchema), asyncHandler(controller.regenerate));
router.get('/:id', authorize(PERMISSIONS.QR_PAYMENTS_READ), validateParams(qrIdParamSchema), asyncHandler(controller.getById));
router.put('/:id', authorize(PERMISSIONS.QR_PAYMENTS_WRITE), validateParams(qrIdParamSchema), validateBody(updateQrBodySchema), asyncHandler(controller.update));

export { router as qrPaymentRoutes };

const publicRouter = Router();
const publicController = new PublicQrPaymentController();
const payLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { success: false, message: 'Too many payment attempts' } });

publicRouter.get('/:token', validateParams(publicTokenParamSchema), asyncHandler(publicController.getByToken));
publicRouter.post('/:token/pay', payLimiter, validateParams(publicTokenParamSchema), validateBody(publicQrPayBodySchema), asyncHandler(publicController.pay));

export { publicRouter as publicQrPaymentRoutes };
