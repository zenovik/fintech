import { Router } from 'express';
import { MerchantController } from '../controllers/merchant.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import { validateBody, validateParams, validateQuery } from '../validators/merchant.validator';
import {
  createDocumentBodySchema,
  createMerchantBodySchema,
  merchantDocumentParamSchema,
  merchantIdParamSchema,
  merchantListQuerySchema,
  merchantSearchQuerySchema,
  merchantTransactionsQuerySchema,
  updateMerchantBodySchema,
  updateMerchantStatusBodySchema,
} from '../dto';

const router = Router();
const controller = new MerchantController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/search', authorize(PERMISSIONS.MERCHANTS_READ), validateQuery(merchantSearchQuerySchema), asyncHandler(controller.search));
router.get('/statistics', authorize(PERMISSIONS.MERCHANTS_READ), asyncHandler(controller.statistics));
router.get('/', authorize(PERMISSIONS.MERCHANTS_READ), validateQuery(merchantListQuerySchema), asyncHandler(controller.list));
router.post('/', authorize(PERMISSIONS.MERCHANTS_WRITE), validateBody(createMerchantBodySchema), asyncHandler(controller.create));
router.get('/:id', authorize(PERMISSIONS.MERCHANTS_READ), validateParams(merchantIdParamSchema), asyncHandler(controller.getById));
router.put('/:id', authorize(PERMISSIONS.MERCHANTS_WRITE), validateParams(merchantIdParamSchema), validateBody(updateMerchantBodySchema), asyncHandler(controller.update));
router.patch('/:id/status', authorize(PERMISSIONS.MERCHANTS_WRITE), validateParams(merchantIdParamSchema), validateBody(updateMerchantStatusBodySchema), asyncHandler(controller.updateStatus));
router.delete('/:id', authorize(PERMISSIONS.MERCHANTS_DELETE), validateParams(merchantIdParamSchema), asyncHandler(controller.remove));
router.get('/:id/transactions', authorize(PERMISSIONS.MERCHANTS_READ), validateParams(merchantIdParamSchema), validateQuery(merchantTransactionsQuerySchema), asyncHandler(controller.transactions));
router.get('/:id/settlements', authorize(PERMISSIONS.MERCHANTS_READ), validateParams(merchantIdParamSchema), asyncHandler(controller.settlements));
router.get('/:id/documents', authorize(PERMISSIONS.MERCHANTS_READ), validateParams(merchantIdParamSchema), asyncHandler(controller.documents));
router.post('/:id/documents', authorize(PERMISSIONS.MERCHANTS_WRITE), validateParams(merchantIdParamSchema), validateBody(createDocumentBodySchema), asyncHandler(controller.createDocument));
router.delete('/:id/documents/:documentId', authorize(PERMISSIONS.MERCHANTS_WRITE), validateParams(merchantDocumentParamSchema), asyncHandler(controller.deleteDocument));

export { router as merchantRoutes };
