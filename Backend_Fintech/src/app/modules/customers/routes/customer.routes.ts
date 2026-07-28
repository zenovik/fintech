import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import { validateBody, validateParams, validateQuery } from '../validators/customers.validator';
import {
  createCustomerBodySchema,
  customerIdParamSchema,
  customerListQuerySchema,
  customerSearchQuerySchema,
  customerTransactionsQuerySchema,
  updateCustomerBodySchema,
  updateCustomerStatusBodySchema,
} from '../dto';

const router = Router();
const controller = new CustomerController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/search', authorize(PERMISSIONS.CUSTOMERS_READ), validateQuery(customerSearchQuerySchema), asyncHandler(controller.search));
router.get('/statistics', authorize(PERMISSIONS.CUSTOMERS_READ), asyncHandler(controller.statistics));
router.get('/', authorize(PERMISSIONS.CUSTOMERS_READ), validateQuery(customerListQuerySchema), asyncHandler(controller.list));
router.post('/', authorize(PERMISSIONS.CUSTOMERS_WRITE), validateBody(createCustomerBodySchema), asyncHandler(controller.create));
router.get('/:id', authorize(PERMISSIONS.CUSTOMERS_READ), validateParams(customerIdParamSchema), asyncHandler(controller.getById));
router.put('/:id', authorize(PERMISSIONS.CUSTOMERS_WRITE), validateParams(customerIdParamSchema), validateBody(updateCustomerBodySchema), asyncHandler(controller.update));
router.patch('/:id/status', authorize(PERMISSIONS.CUSTOMERS_WRITE), validateParams(customerIdParamSchema), validateBody(updateCustomerStatusBodySchema), asyncHandler(controller.updateStatus));
router.delete('/:id', authorize(PERMISSIONS.CUSTOMERS_DELETE), validateParams(customerIdParamSchema), asyncHandler(controller.remove));
router.get('/:id/transactions', authorize(PERMISSIONS.CUSTOMERS_READ), validateParams(customerIdParamSchema), validateQuery(customerTransactionsQuerySchema), asyncHandler(controller.transactions));
router.get('/:id/merchants', authorize(PERMISSIONS.CUSTOMERS_READ), validateParams(customerIdParamSchema), asyncHandler(controller.merchants));
router.get('/:id/preferences', authorize(PERMISSIONS.CUSTOMERS_READ), validateParams(customerIdParamSchema), asyncHandler(controller.preferences));
router.put('/:id/preferences', authorize(PERMISSIONS.CUSTOMERS_WRITE), validateParams(customerIdParamSchema), asyncHandler(controller.updatePreferences));
router.get('/:id/payment-methods', authorize(PERMISSIONS.CUSTOMERS_READ), validateParams(customerIdParamSchema), asyncHandler(controller.paymentMethods));
router.get('/:id/timeline', authorize(PERMISSIONS.CUSTOMERS_READ), validateParams(customerIdParamSchema), asyncHandler(controller.timeline));

export { router as customerRoutes };
