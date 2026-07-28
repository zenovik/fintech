import { Router } from 'express';
import { PricingController } from '../controllers/pricing.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';

const router = Router();
const controller = new PricingController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/', authorize(PERMISSIONS.PRICING_READ), asyncHandler(controller.list));
router.post('/', authorize(PERMISSIONS.PRICING_WRITE), asyncHandler(controller.create));
router.get('/:id', authorize(PERMISSIONS.PRICING_READ), asyncHandler(controller.getById));

export { router as pricingRoutes };
