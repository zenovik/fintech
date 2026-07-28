import { Router } from 'express';
import { AcceptanceController } from '../controllers/acceptance.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';

const router = Router();
const controller = new AcceptanceController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/analytics', authorize(PERMISSIONS.ACCEPTANCE_ANALYTICS_READ), asyncHandler(controller.analytics));
router.get('/top-merchants', authorize(PERMISSIONS.ACCEPTANCE_ANALYTICS_READ), asyncHandler(controller.topMerchants));
router.get('/failure-insights', authorize(PERMISSIONS.ACCEPTANCE_ANALYTICS_READ), asyncHandler(controller.failureInsights));
router.get('/merchant-portal/:merchantId', authorize(PERMISSIONS.MERCHANT_PORTAL_READ), asyncHandler(controller.merchantPortal));

export { router as acceptanceRoutes };
