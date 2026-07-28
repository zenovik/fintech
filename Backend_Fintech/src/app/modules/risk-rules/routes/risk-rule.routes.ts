import { Router } from 'express';
import { RiskRuleController } from '../controllers/risk-rule.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';

const router = Router();
const controller = new RiskRuleController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/', authorize(PERMISSIONS.RISK_RULES_READ), asyncHandler(controller.list));
router.post('/', authorize(PERMISSIONS.RISK_RULES_WRITE), asyncHandler(controller.create));
router.get('/:id', authorize(PERMISSIONS.RISK_RULES_READ), asyncHandler(controller.getById));
router.put('/:id', authorize(PERMISSIONS.RISK_RULES_WRITE), asyncHandler(controller.update));
router.post('/:id/evaluate', authorize(PERMISSIONS.RISK_RULES_MANAGE), asyncHandler(controller.evaluate));

export { router as riskRuleRoutes };
