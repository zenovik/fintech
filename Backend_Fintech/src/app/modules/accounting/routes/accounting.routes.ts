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

router.get('/journals', authorize(PERMISSIONS.ACCOUNTING_READ), asyncHandler(controller.listJournals));
router.get('/journals/:id', authorize(PERMISSIONS.ACCOUNTING_READ), asyncHandler(controller.getJournal));
router.post('/journals', authorize(PERMISSIONS.LEDGER_POST), asyncHandler(controller.postJournal));
router.post('/journals/:id/reverse', authorize(PERMISSIONS.LEDGER_REVERSE), asyncHandler(controller.reverseJournal));
router.get('/trial-balance', authorize(PERMISSIONS.ACCOUNTING_READ), asyncHandler(controller.trialBalance));
router.get('/validate-balances', authorize(PERMISSIONS.ACCOUNTING_READ), asyncHandler(controller.validateBalances));
router.get('/periods', authorize(PERMISSIONS.ACCOUNTING_READ), asyncHandler(controller.listPeriods));
router.post('/periods/close', authorize(PERMISSIONS.ACCOUNTING_WRITE), asyncHandler(controller.closePeriod));

export { router as accountingRoutes };
