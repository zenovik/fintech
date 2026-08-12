import { Router } from 'express';
import { SettlementController } from '../controllers/settlement.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import { validateBody, validateParams, validateQuery } from '../validators/settlement.validator';
import {
  batchIdParamSchema,
  createBatchBodySchema,
  createSettlementBodySchema,
  exportQuerySchema,
  reversalBodySchema,
  settlementIdParamSchema,
  settlementListQuerySchema,
  settlementSearchQuerySchema,
  updateSettlementStatusBodySchema,
} from '../dto';

const router = Router();
const controller = new SettlementController();

router.use(authenticate);
router.use(requireOrganization());

router.post('/batch/run', authorize(PERMISSIONS.SETTLEMENTS_WRITE), asyncHandler(controller.runBatch));
router.get('/calendar', authorize(PERMISSIONS.SETTLEMENTS_READ), asyncHandler(controller.calendar));
router.get('/reserves', authorize(PERMISSIONS.SETTLEMENTS_READ), asyncHandler(controller.listReserves));
router.post('/merchants/:merchantId/reserves', authorize(PERMISSIONS.SETTLEMENTS_WRITE), asyncHandler(controller.createReserve));
router.get('/search', authorize(PERMISSIONS.SETTLEMENTS_READ), validateQuery(settlementSearchQuerySchema), asyncHandler(controller.search));
router.get('/statistics', authorize(PERMISSIONS.SETTLEMENTS_READ), validateQuery(settlementListQuerySchema.partial()), asyncHandler(controller.statistics));
router.get('/export', authorize(PERMISSIONS.SETTLEMENTS_EXPORT), validateQuery(exportQuerySchema), asyncHandler(controller.export));
router.get('/batches', authorize(PERMISSIONS.SETTLEMENTS_READ), asyncHandler(controller.batches));
router.post('/batches', authorize(PERMISSIONS.SETTLEMENTS_WRITE), validateBody(createBatchBodySchema), asyncHandler(controller.createBatch));
router.get('/batches/:id', authorize(PERMISSIONS.SETTLEMENTS_READ), validateParams(batchIdParamSchema), asyncHandler(controller.batchById));
router.get('/', authorize(PERMISSIONS.SETTLEMENTS_READ), validateQuery(settlementListQuerySchema), asyncHandler(controller.list));
router.post('/', authorize(PERMISSIONS.SETTLEMENTS_WRITE), validateBody(createSettlementBodySchema), asyncHandler(controller.create));
router.get('/:id', authorize(PERMISSIONS.SETTLEMENTS_READ), validateParams(settlementIdParamSchema), asyncHandler(controller.getById));
router.patch('/:id/status', authorize(PERMISSIONS.SETTLEMENTS_WRITE), validateParams(settlementIdParamSchema), validateBody(updateSettlementStatusBodySchema), asyncHandler(controller.updateStatus));
router.get('/:id/transactions', authorize(PERMISSIONS.SETTLEMENTS_READ), validateParams(settlementIdParamSchema), asyncHandler(controller.transactions));
router.post('/:id/hold', authorize(PERMISSIONS.SETTLEMENTS_WRITE), validateParams(settlementIdParamSchema), asyncHandler(controller.hold));
router.post('/:id/release', authorize(PERMISSIONS.SETTLEMENTS_WRITE), validateParams(settlementIdParamSchema), asyncHandler(controller.release));
router.post('/:id/retry', authorize(PERMISSIONS.SETTLEMENTS_WRITE), validateParams(settlementIdParamSchema), asyncHandler(controller.retry));
router.post('/:id/reversal', authorize(PERMISSIONS.SETTLEMENTS_WRITE), validateParams(settlementIdParamSchema), validateBody(reversalBodySchema), asyncHandler(controller.reversal));

export { router as settlementRoutes };
