import { Router } from 'express';
import { FraudController } from '../controllers/fraud.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';

const router = Router();
const controller = new FraudController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/', authorize(PERMISSIONS.FRAUD_READ), asyncHandler(controller.list));
router.get('/:id', authorize(PERMISSIONS.FRAUD_READ), asyncHandler(controller.getById));
router.post('/:id/approve', authorize(PERMISSIONS.FRAUD_WRITE), asyncHandler(controller.approve));
router.post('/:id/reject', authorize(PERMISSIONS.FRAUD_WRITE), asyncHandler(controller.reject));
router.post('/:id/release', authorize(PERMISSIONS.FRAUD_MANAGE), asyncHandler(controller.release));

export { router as fraudRoutes };
