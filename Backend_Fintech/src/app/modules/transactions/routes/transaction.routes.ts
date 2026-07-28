import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import { validateBody, validateParams, validateQuery } from '../validators/transaction.validator';
import {
  createDisputeBodySchema,
  createTransactionBodySchema,
  exportQuerySchema,
  refundTransactionBodySchema,
  transactionIdParamSchema,
  transactionListQuerySchema,
  transactionSearchQuerySchema,
  updateTransactionStatusBodySchema,
} from '../dto';

const router = Router();
const controller = new TransactionController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/search', authorize(PERMISSIONS.TRANSACTIONS_READ), validateQuery(transactionSearchQuerySchema), asyncHandler(controller.search));
router.get('/statistics', authorize(PERMISSIONS.TRANSACTIONS_READ), validateQuery(transactionListQuerySchema.partial()), asyncHandler(controller.statistics));
router.get('/export', authorize(PERMISSIONS.TRANSACTIONS_EXPORT), validateQuery(exportQuerySchema), asyncHandler(controller.export));
router.get('/disputes', authorize(PERMISSIONS.CHARGEBACKS_READ), asyncHandler(controller.disputes));
router.post('/disputes', authorize(PERMISSIONS.CHARGEBACKS_WRITE), validateBody(createDisputeBodySchema), asyncHandler(controller.createDispute));
router.get('/', authorize(PERMISSIONS.TRANSACTIONS_READ), validateQuery(transactionListQuerySchema), asyncHandler(controller.list));
router.post('/', authorize(PERMISSIONS.TRANSACTIONS_WRITE), validateBody(createTransactionBodySchema), asyncHandler(controller.create));
router.get('/:id', authorize(PERMISSIONS.TRANSACTIONS_READ), validateParams(transactionIdParamSchema), asyncHandler(controller.getById));
router.patch('/:id/status', authorize(PERMISSIONS.TRANSACTIONS_WRITE), validateParams(transactionIdParamSchema), validateBody(updateTransactionStatusBodySchema), asyncHandler(controller.updateStatus));
router.post('/:id/refund', authorize(PERMISSIONS.REFUNDS_WRITE), validateParams(transactionIdParamSchema), validateBody(refundTransactionBodySchema), asyncHandler(controller.refund));

export { router as transactionRoutes };
