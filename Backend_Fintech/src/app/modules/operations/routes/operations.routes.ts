import { Router } from 'express';
import { OperationsController } from '../controllers/operations.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import { validateParams, validateQuery } from '../validators/operations.validator';
import { alertListQuerySchema, idParamSchema, incidentListQuerySchema, jobListQuerySchema, retryListQuerySchema } from '../dto';

const router = Router();
const controller = new OperationsController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/dashboard', authorize(PERMISSIONS.OPERATIONS_READ), asyncHandler(controller.dashboard));
router.get('/queues', authorize(PERMISSIONS.OPERATIONS_READ), asyncHandler(controller.queuesDashboard));
router.get('/dead-letter-queue', authorize(PERMISSIONS.OPERATIONS_READ), asyncHandler(controller.deadLetterQueue));
router.get('/maintenance', authorize(PERMISSIONS.OPERATIONS_READ), asyncHandler(controller.getMaintenanceMode));
router.put('/maintenance', authorize(PERMISSIONS.OPERATIONS_MANAGE), asyncHandler(controller.setMaintenanceMode));
router.get('/deployments', authorize(PERMISSIONS.OPERATIONS_READ), asyncHandler(controller.deploymentHistory));
router.get('/pending-tasks', authorize(PERMISSIONS.OPERATIONS_READ), asyncHandler(controller.pendingTasks));
router.get('/health', authorize(PERMISSIONS.OPERATIONS_READ), asyncHandler(controller.health));
router.get('/alerts', authorize(PERMISSIONS.OPERATIONS_READ), validateQuery(alertListQuerySchema), asyncHandler(controller.alerts));
router.get('/incidents', authorize(PERMISSIONS.OPERATIONS_READ), validateQuery(incidentListQuerySchema), asyncHandler(controller.incidents));
router.get('/retry-queue', authorize(PERMISSIONS.OPERATIONS_READ), validateQuery(retryListQuerySchema), asyncHandler(controller.retryQueue));
router.get('/jobs', authorize(PERMISSIONS.OPERATIONS_READ), validateQuery(jobListQuerySchema), asyncHandler(controller.jobs));
router.get('/failed-payments', authorize(PERMISSIONS.OPERATIONS_READ), asyncHandler(controller.failedPayments));
router.get('/failed-payouts', authorize(PERMISSIONS.OPERATIONS_READ), asyncHandler(controller.failedPayouts));
router.get('/failed-webhooks', authorize(PERMISSIONS.OPERATIONS_READ), asyncHandler(controller.failedWebhooks));
router.post('/alerts/:id/acknowledge', authorize(PERMISSIONS.OPERATIONS_WRITE), validateParams(idParamSchema), asyncHandler(controller.acknowledgeAlert));
router.post('/alerts/:id/resolve', authorize(PERMISSIONS.OPERATIONS_WRITE), validateParams(idParamSchema), asyncHandler(controller.resolveAlert));
router.post('/retry-queue/:id/retry', authorize(PERMISSIONS.OPERATIONS_MANAGE), validateParams(idParamSchema), asyncHandler(controller.retryQueueItem));
router.post('/jobs/:id/retry', authorize(PERMISSIONS.OPERATIONS_MANAGE), validateParams(idParamSchema), asyncHandler(controller.retryJob));

export { router as operationsRoutes };
