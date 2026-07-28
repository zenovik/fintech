import { Router } from 'express';
import { ExecutiveDashboardController } from '../controllers/executive-dashboard.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import { validateBody, validateQuery } from '../validators/dashboard.validator';
import {
  exportBodySchema,
  highValueTransactionsQuerySchema,
  periodQuerySchema,
  preferencesBodySchema,
  dashboardAiChatBodySchema,
} from '../dto';
import { aiChatRateLimiter } from '../../ai/middleware/ai-rate-limit.middleware';
import { validateBody as validateAiBody } from '../../ai/validators/ai.validator';

const router = Router();
const controller = new ExecutiveDashboardController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/summary', authorize(PERMISSIONS.DASHBOARD_READ), validateQuery(periodQuerySchema), asyncHandler(controller.summary));
router.get('/charts/revenue', authorize(PERMISSIONS.DASHBOARD_READ), validateQuery(periodQuerySchema), asyncHandler(controller.revenueChart));
router.get('/charts/payment-methods', authorize(PERMISSIONS.DASHBOARD_READ), validateQuery(periodQuerySchema), asyncHandler(controller.paymentMethods));
router.get('/charts/regional-distribution', authorize(PERMISSIONS.DASHBOARD_READ), validateQuery(periodQuerySchema), asyncHandler(controller.regionalDistribution));
router.get('/transactions/high-value', authorize(PERMISSIONS.DASHBOARD_READ), validateQuery(highValueTransactionsQuerySchema), asyncHandler(controller.highValueTransactions));
router.get('/activities', authorize(PERMISSIONS.DASHBOARD_READ), asyncHandler(controller.activities));
router.get('/fraud-alerts', authorize(PERMISSIONS.DASHBOARD_READ), asyncHandler(controller.fraudAlerts));
router.get('/onboarding-stats', authorize(PERMISSIONS.ONBOARDING_WORKFLOW_READ), asyncHandler(controller.onboardingStats));
router.get('/payment-platform-stats', authorize(PERMISSIONS.DASHBOARD_READ), asyncHandler(controller.paymentPlatformStats));
router.get('/operations-stats', authorize(PERMISSIONS.OPERATIONS_READ), asyncHandler(controller.operationsStats));
router.post('/export', authorize(PERMISSIONS.DASHBOARD_EXPORT), validateBody(exportBodySchema), asyncHandler(controller.exportReport));
router.get('/preferences', authorize(PERMISSIONS.DASHBOARD_READ), asyncHandler(controller.getPreferences));
router.put('/preferences', authorize(PERMISSIONS.DASHBOARD_EXPORT), validateBody(preferencesBodySchema), asyncHandler(controller.updatePreferences));

router.post(
  '/ai/chat',
  authorize(PERMISSIONS.AI_CHAT),
  authorize(PERMISSIONS.DASHBOARD_READ),
  aiChatRateLimiter,
  validateAiBody(dashboardAiChatBodySchema),
  asyncHandler(controller.aiChat),
);

export { router as executiveDashboardRoutes };
