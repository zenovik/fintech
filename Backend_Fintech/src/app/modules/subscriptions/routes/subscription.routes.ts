import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import { validateBody, validateParams, validateQuery } from '../validators/subscriptions.validator';
import { createPlanBodySchema, createSubscriptionBodySchema, idParamSchema, planListQuerySchema, subscriptionListQuerySchema } from '../dto';

const router = Router();
const controller = new SubscriptionController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/statistics', authorize(PERMISSIONS.SUBSCRIPTIONS_READ), asyncHandler(controller.statistics));
router.get('/analytics', authorize(PERMISSIONS.SUBSCRIPTIONS_READ), asyncHandler(controller.analytics));
router.get('/dunning', authorize(PERMISSIONS.SUBSCRIPTIONS_READ), asyncHandler(controller.listDunning));
router.get('/mandates', authorize(PERMISSIONS.SUBSCRIPTIONS_READ), asyncHandler(controller.listMandates));
router.get('/plans', authorize(PERMISSIONS.SUBSCRIPTIONS_READ), validateQuery(planListQuerySchema), asyncHandler(controller.listPlans));
router.post('/plans', authorize(PERMISSIONS.SUBSCRIPTIONS_WRITE), validateBody(createPlanBodySchema), asyncHandler(controller.createPlan));
router.get('/', authorize(PERMISSIONS.SUBSCRIPTIONS_READ), validateQuery(subscriptionListQuerySchema), asyncHandler(controller.list));
router.post('/', authorize(PERMISSIONS.SUBSCRIPTIONS_WRITE), validateBody(createSubscriptionBodySchema), asyncHandler(controller.create));
router.post('/:id/pause', authorize(PERMISSIONS.SUBSCRIPTIONS_MANAGE), validateParams(idParamSchema), asyncHandler(controller.pause));
router.post('/:id/resume', authorize(PERMISSIONS.SUBSCRIPTIONS_MANAGE), validateParams(idParamSchema), asyncHandler(controller.resume));
router.post('/:id/upgrade', authorize(PERMISSIONS.SUBSCRIPTIONS_MANAGE), validateParams(idParamSchema), asyncHandler(controller.upgrade));
router.post('/:id/downgrade', authorize(PERMISSIONS.SUBSCRIPTIONS_MANAGE), validateParams(idParamSchema), asyncHandler(controller.downgrade));
router.post('/:id/cancel', authorize(PERMISSIONS.SUBSCRIPTIONS_MANAGE), validateParams(idParamSchema), asyncHandler(controller.cancel));
router.post('/:id/renew', authorize(PERMISSIONS.SUBSCRIPTIONS_MANAGE), validateParams(idParamSchema), asyncHandler(controller.renew));
router.post('/:id/fail', authorize(PERMISSIONS.SUBSCRIPTIONS_MANAGE), validateParams(idParamSchema), asyncHandler(controller.markFailed));
router.get('/:id', authorize(PERMISSIONS.SUBSCRIPTIONS_READ), validateParams(idParamSchema), asyncHandler(controller.getById));

export { router as subscriptionRoutes };
