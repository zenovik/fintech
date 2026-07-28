import { Router } from 'express';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import { syncAuthenticatedRequestContext } from '../../../shared/middleware/request-context.middleware';
import { SystemController } from '../controllers/system.controller';

const router = Router();
const controller = new SystemController();

router.use(authenticate);
router.use(syncAuthenticatedRequestContext);
router.use(authorize(PERMISSIONS.SYSTEM_VIEW));

router.get('/admin/status', asyncHandler(controller.adminStatus));
router.get('/health', asyncHandler(controller.health));
router.get('/liveness', asyncHandler(controller.liveness));
router.get('/readiness', asyncHandler(controller.readiness));
router.get('/metrics', asyncHandler(controller.metrics));
router.get('/version', asyncHandler(controller.version));
router.get('/cache-config', asyncHandler(controller.listCacheConfig));
router.put('/cache-config/:id', asyncHandler(controller.updateCacheConfig));
router.get('/backup-config', asyncHandler(controller.listBackupConfig));
router.put('/backup-config/:id', asyncHandler(controller.updateBackupConfig));
router.get('/jobs/history', asyncHandler(controller.jobHistory));
router.get('/performance', asyncHandler(controller.performanceMetrics));

export { router as systemRoutes };
