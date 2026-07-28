import { Router } from 'express';
import { SmartCollectController } from '../controllers/smart-collect.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';

const router = Router();
const controller = new SmartCollectController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/dashboard', authorize(PERMISSIONS.SMART_COLLECT_READ), asyncHandler(controller.dashboard));
router.get('/virtual-accounts', authorize(PERMISSIONS.SMART_COLLECT_READ), asyncHandler(controller.listVirtualAccounts));
router.post('/virtual-accounts', authorize(PERMISSIONS.SMART_COLLECT_WRITE), asyncHandler(controller.createVirtualAccount));
router.get('/virtual-accounts/:id', authorize(PERMISSIONS.SMART_COLLECT_READ), asyncHandler(controller.getVirtualAccount));
router.get('/collections', authorize(PERMISSIONS.SMART_COLLECT_READ), asyncHandler(controller.listCollections));
router.get('/collections/:id', authorize(PERMISSIONS.SMART_COLLECT_READ), asyncHandler(controller.getCollection));
router.post('/collections/:id/match', authorize(PERMISSIONS.SMART_COLLECT_WRITE), asyncHandler(controller.matchCollection));

export { router as smartCollectRoutes };
