import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';

const router = Router();
const controller = new ActivityController();

router.use(authenticate);
router.use(requireOrganization());
router.get('/timeline', authorize(PERMISSIONS.ACTIVITY_CENTER_READ), asyncHandler(controller.timeline));

export { router as activityRoutes };
