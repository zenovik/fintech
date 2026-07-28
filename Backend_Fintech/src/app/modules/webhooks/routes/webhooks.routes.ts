import { Router } from 'express';
import { WebhooksController } from '../controllers/webhooks.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import { validateBody } from '../../auth/validators/auth.validator';
import {
  createWebhookSchema,
  updateWebhookSchema,
  createSubscriptionSchema,
  updateSubscriptionSchema,
  retryDeliverySchema,
} from '../dto/webhooks.dto';

const router = Router();
const controller = new WebhooksController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/dashboard', authorize(PERMISSIONS.WEBHOOKS_READ), asyncHandler(controller.dashboard));
router.get('/endpoints', authorize(PERMISSIONS.WEBHOOKS_READ), asyncHandler(controller.listWebhooks));
router.post('/endpoints', authorize(PERMISSIONS.WEBHOOKS_WRITE), validateBody(createWebhookSchema), asyncHandler(controller.createWebhook));
router.get('/endpoints/:id', authorize(PERMISSIONS.WEBHOOKS_READ), asyncHandler(controller.getWebhook));
router.put('/endpoints/:id', authorize(PERMISSIONS.WEBHOOKS_WRITE), validateBody(updateWebhookSchema), asyncHandler(controller.updateWebhook));
router.delete('/endpoints/:id', authorize(PERMISSIONS.WEBHOOKS_MANAGE), asyncHandler(controller.deleteWebhook));
router.post('/endpoints/:id/subscriptions', authorize(PERMISSIONS.WEBHOOKS_WRITE), validateBody(createSubscriptionSchema), asyncHandler(controller.createSubscription));
router.put('/endpoints/:id/subscriptions/:subId', authorize(PERMISSIONS.WEBHOOKS_WRITE), validateBody(updateSubscriptionSchema), asyncHandler(controller.updateSubscription));
router.delete('/endpoints/:id/subscriptions/:subId', authorize(PERMISSIONS.WEBHOOKS_MANAGE), asyncHandler(controller.deleteSubscription));
router.get('/deliveries', authorize(PERMISSIONS.WEBHOOKS_READ), asyncHandler(controller.listDeliveries));
router.get('/deliveries/:id', authorize(PERMISSIONS.WEBHOOKS_READ), asyncHandler(controller.getDelivery));
router.post('/deliveries/:id/retry', authorize(PERMISSIONS.WEBHOOKS_MANAGE), validateBody(retryDeliverySchema), asyncHandler(controller.retryDelivery));

export { router as webhooksRoutes };
