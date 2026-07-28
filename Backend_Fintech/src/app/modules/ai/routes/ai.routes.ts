import { Router } from 'express';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import { AiController } from '../controllers/ai.controller';
import { validateBody } from '../validators/ai.validator';
import { aiChatBodySchema } from '../dto/ai.dto';
import { aiChatRateLimiter } from '../middleware/ai-rate-limit.middleware';

const router = Router();
const controller = new AiController();

router.use(authenticate);
router.use(requireOrganization());

router.post(
  '/chat',
  authorize(PERMISSIONS.AI_CHAT),
  aiChatRateLimiter,
  validateBody(aiChatBodySchema),
  asyncHandler(controller.chat),
);

router.get('/insights/dashboard', authorize(PERMISSIONS.AI_INSIGHTS_READ), asyncHandler(controller.insightsDashboard));
router.get('/insights/revenue-forecast', authorize(PERMISSIONS.AI_INSIGHTS_READ), asyncHandler(controller.revenueForecast));
router.get('/insights/settlement-forecast', authorize(PERMISSIONS.AI_INSIGHTS_READ), asyncHandler(controller.settlementForecast));
router.get('/insights/merchant-health', authorize(PERMISSIONS.AI_INSIGHTS_READ), asyncHandler(controller.merchantHealth));
router.get('/insights/fraud-prediction', authorize(PERMISSIONS.AI_INSIGHTS_READ), asyncHandler(controller.fraudPrediction));
router.post('/search', authorize(PERMISSIONS.AI_INSIGHTS_READ), asyncHandler(controller.nlSearch));

export { router as aiRoutes };
