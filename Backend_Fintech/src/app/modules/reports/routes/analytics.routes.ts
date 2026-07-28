import { Router } from 'express';
import { AnalyticsController } from '../controllers/reports.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import { validateQuery } from '../validators/reports.validator';
import { analyticsQuerySchema, exportQuerySchema } from '../dto';

const router = Router();
const controller = new AnalyticsController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/overview', authorize(PERMISSIONS.ANALYTICS_READ), validateQuery(analyticsQuerySchema), asyncHandler(controller.overview));
router.get('/revenue', authorize(PERMISSIONS.ANALYTICS_READ), validateQuery(analyticsQuerySchema), asyncHandler(controller.revenue));
router.get('/transactions', authorize(PERMISSIONS.ANALYTICS_READ), validateQuery(analyticsQuerySchema), asyncHandler(controller.transactions));
router.get('/settlements', authorize(PERMISSIONS.ANALYTICS_READ), validateQuery(analyticsQuerySchema), asyncHandler(controller.settlements));
router.get('/merchants', authorize(PERMISSIONS.ANALYTICS_READ), validateQuery(analyticsQuerySchema), asyncHandler(controller.merchants));
router.get('/customers', authorize(PERMISSIONS.ANALYTICS_READ), validateQuery(analyticsQuerySchema), asyncHandler(controller.customers));
router.get('/refunds', authorize(PERMISSIONS.ANALYTICS_READ), validateQuery(analyticsQuerySchema), asyncHandler(controller.refunds));
router.get('/chargebacks', authorize(PERMISSIONS.ANALYTICS_READ), validateQuery(analyticsQuerySchema), asyncHandler(controller.chargebacks));
router.get('/payouts', authorize(PERMISSIONS.ANALYTICS_READ), validateQuery(analyticsQuerySchema), asyncHandler(controller.payouts));
router.get('/payment-links', authorize(PERMISSIONS.ANALYTICS_READ), validateQuery(analyticsQuerySchema), asyncHandler(controller.paymentLinks));
router.get('/invoices', authorize(PERMISSIONS.ANALYTICS_READ), validateQuery(analyticsQuerySchema), asyncHandler(controller.invoices));
router.get('/qr-payments', authorize(PERMISSIONS.ANALYTICS_READ), validateQuery(analyticsQuerySchema), asyncHandler(controller.qrPayments));
router.get('/subscriptions', authorize(PERMISSIONS.ANALYTICS_READ), validateQuery(analyticsQuerySchema), asyncHandler(controller.subscriptions));
router.get('/support', authorize(PERMISSIONS.ANALYTICS_READ), validateQuery(analyticsQuerySchema), asyncHandler(controller.support));
router.get('/operations', authorize(PERMISSIONS.ANALYTICS_READ), validateQuery(analyticsQuerySchema), asyncHandler(controller.operations));
router.get('/payment-methods', authorize(PERMISSIONS.ANALYTICS_READ), validateQuery(analyticsQuerySchema), asyncHandler(controller.paymentMethods));
router.get('/regional', authorize(PERMISSIONS.ANALYTICS_READ), validateQuery(analyticsQuerySchema), asyncHandler(controller.regional));
router.get('/export', authorize(PERMISSIONS.ANALYTICS_EXPORT), validateQuery(exportQuerySchema), asyncHandler(controller.export));

export { router as analyticsRoutes };
