import { Router } from 'express';
import { AccountingController } from '../controllers/accounting.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';

const router = Router();
const controller = new AccountingController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/accounts', authorize(PERMISSIONS.ACCOUNTING_READ), asyncHandler(controller.listAccounts));
router.get('/entries', authorize(PERMISSIONS.ACCOUNTING_READ), asyncHandler(controller.listEntries));
router.get('/summary', authorize(PERMISSIONS.ACCOUNTING_READ), asyncHandler(controller.summary));
router.get('/export', authorize(PERMISSIONS.ACCOUNTING_EXPORT), asyncHandler(controller.export));

export { router as accountingRoutes };
