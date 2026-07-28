import { Router } from 'express';
import { PayoutController } from '../controllers/payout.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import { validateBody, validateParams, validateQuery } from '../validators/payouts.validator';
import {
  bankAccountIdParamSchema,
  bankAccountListQuerySchema,
  createBankAccountBodySchema,
  createPayoutBodySchema,
  payoutIdParamSchema,
  payoutListQuerySchema,
  rejectPayoutBodySchema,
  updateBankAccountBodySchema,
} from '../dto';

const router = Router();
const controller = new PayoutController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/statistics', authorize(PERMISSIONS.PAYOUTS_READ), asyncHandler(controller.statistics));
router.get('/bank-accounts', authorize(PERMISSIONS.PAYOUTS_READ), validateQuery(bankAccountListQuerySchema), asyncHandler(controller.listBankAccounts));
router.post('/bank-accounts', authorize(PERMISSIONS.PAYOUTS_WRITE), validateBody(createBankAccountBodySchema), asyncHandler(controller.createBankAccount));
router.patch('/bank-accounts/:id', authorize(PERMISSIONS.PAYOUTS_WRITE), validateParams(bankAccountIdParamSchema), validateBody(updateBankAccountBodySchema), asyncHandler(controller.updateBankAccount));

router.get('/', authorize(PERMISSIONS.PAYOUTS_READ), validateQuery(payoutListQuerySchema), asyncHandler(controller.list));
router.post('/', authorize(PERMISSIONS.PAYOUTS_WRITE), validateBody(createPayoutBodySchema), asyncHandler(controller.create));
router.get('/:id/history', authorize(PERMISSIONS.PAYOUTS_READ), validateParams(payoutIdParamSchema), asyncHandler(controller.history));
router.post('/:id/approve', authorize(PERMISSIONS.PAYOUTS_APPROVE), validateParams(payoutIdParamSchema), asyncHandler(controller.approve));
router.post('/:id/reject', authorize(PERMISSIONS.PAYOUTS_APPROVE), validateParams(payoutIdParamSchema), validateBody(rejectPayoutBodySchema), asyncHandler(controller.reject));
router.post('/:id/retry', authorize(PERMISSIONS.PAYOUTS_WRITE), validateParams(payoutIdParamSchema), asyncHandler(controller.retry));
router.get('/:id', authorize(PERMISSIONS.PAYOUTS_READ), validateParams(payoutIdParamSchema), asyncHandler(controller.getById));

export { router as payoutRoutes };
