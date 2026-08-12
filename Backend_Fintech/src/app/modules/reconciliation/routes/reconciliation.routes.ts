import { Router } from 'express';
import { ReconciliationController } from '../controllers/reconciliation.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';

const router = Router();
const controller = new ReconciliationController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/dashboard', authorize(PERMISSIONS.RECONCILIATION_READ), asyncHandler(controller.dashboard));
router.get('/imports', authorize(PERMISSIONS.RECONCILIATION_READ), asyncHandler(controller.listImports));
router.post('/imports', authorize(PERMISSIONS.RECONCILIATION_WRITE), asyncHandler(controller.createImport));
router.get('/imports/:id', authorize(PERMISSIONS.RECONCILIATION_READ), asyncHandler(controller.getImport));
router.put('/imports/:id', authorize(PERMISSIONS.RECONCILIATION_WRITE), asyncHandler(controller.updateImport));
router.delete('/imports/:id', authorize(PERMISSIONS.RECONCILIATION_MANAGE), asyncHandler(controller.deleteImport));
router.post('/imports/:id/auto-match', authorize(PERMISSIONS.RECONCILIATION_WRITE), asyncHandler(controller.autoMatchImport));
router.post('/imports/:importId/records', authorize(PERMISSIONS.RECONCILIATION_WRITE), asyncHandler(controller.createRecord));
router.get('/records', authorize(PERMISSIONS.RECONCILIATION_READ), asyncHandler(controller.listRecords));
router.get('/records/:id', authorize(PERMISSIONS.RECONCILIATION_READ), asyncHandler(controller.getRecord));
router.post('/records/:id/match', authorize(PERMISSIONS.RECONCILIATION_WRITE), asyncHandler(controller.matchRecord));

export { router as reconciliationRoutes };
