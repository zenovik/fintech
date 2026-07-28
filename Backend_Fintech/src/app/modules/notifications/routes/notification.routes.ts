import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../validators/notifications.validator';
import {
  notificationListQuerySchema,
  notificationIdParamSchema,
  templateListQuerySchema,
  templateIdParamSchema,
  createTemplateBodySchema,
  updateTemplateBodySchema,
  broadcastListQuerySchema,
  createBroadcastBodySchema,
} from '../dto';

const router = Router();
const controller = new NotificationController();

router.use(authenticate);

// User notification center
router.get('/', authorize(PERMISSIONS.NOTIFICATIONS_READ), validateQuery(notificationListQuerySchema), asyncHandler(controller.list));
router.get('/unread-count', authorize(PERMISSIONS.NOTIFICATIONS_READ), asyncHandler(controller.unreadCount));
router.patch('/read-all', authorize(PERMISSIONS.NOTIFICATIONS_WRITE), asyncHandler(controller.markAllRead));
router.patch('/archive-all', authorize(PERMISSIONS.NOTIFICATIONS_WRITE), asyncHandler(controller.archiveAll));

// Templates
router.get('/templates', authorize(PERMISSIONS.NOTIFICATIONS_MANAGE), validateQuery(templateListQuerySchema), asyncHandler(controller.listTemplates));
router.post('/templates', authorize(PERMISSIONS.NOTIFICATIONS_MANAGE), validateBody(createTemplateBodySchema), asyncHandler(controller.createTemplate));
router.get('/templates/:id', authorize(PERMISSIONS.NOTIFICATIONS_MANAGE), validateParams(templateIdParamSchema), asyncHandler(controller.getTemplate));
router.put('/templates/:id', authorize(PERMISSIONS.NOTIFICATIONS_MANAGE), validateParams(templateIdParamSchema), validateBody(updateTemplateBodySchema), asyncHandler(controller.updateTemplate));
router.delete('/templates/:id', authorize(PERMISSIONS.NOTIFICATIONS_MANAGE), validateParams(templateIdParamSchema), asyncHandler(controller.deleteTemplate));

// Broadcasts
router.get('/broadcasts', authorize(PERMISSIONS.NOTIFICATIONS_BROADCAST), validateQuery(broadcastListQuerySchema), asyncHandler(controller.listBroadcasts));
router.post('/broadcasts', authorize(PERMISSIONS.NOTIFICATIONS_BROADCAST), validateBody(createBroadcastBodySchema), asyncHandler(controller.createBroadcast));

router.get('/campaigns', authorize(PERMISSIONS.NOTIFICATIONS_MANAGE), asyncHandler(controller.listCampaigns));
router.post('/campaigns', authorize(PERMISSIONS.NOTIFICATIONS_MANAGE), asyncHandler(controller.createCampaign));
router.get('/campaigns/:id', authorize(PERMISSIONS.NOTIFICATIONS_MANAGE), asyncHandler(controller.getCampaign));
router.put('/campaigns/:id', authorize(PERMISSIONS.NOTIFICATIONS_MANAGE), asyncHandler(controller.updateCampaign));
router.delete('/campaigns/:id', authorize(PERMISSIONS.NOTIFICATIONS_MANAGE), asyncHandler(controller.deleteCampaign));
router.get('/templates/:id/variables', authorize(PERMISSIONS.NOTIFICATIONS_MANAGE), validateParams(templateIdParamSchema), asyncHandler(controller.getTemplateVariables));

// Metadata
router.get('/channels', authorize(PERMISSIONS.NOTIFICATIONS_READ), asyncHandler(controller.getChannels));
router.get('/events', authorize(PERMISSIONS.NOTIFICATIONS_READ), asyncHandler(controller.getEvents));
router.get('/groups', authorize(PERMISSIONS.NOTIFICATIONS_BROADCAST), asyncHandler(controller.getGroups));

// Single notification (must be after static paths)
router.get('/:id', authorize(PERMISSIONS.NOTIFICATIONS_READ), validateParams(notificationIdParamSchema), asyncHandler(controller.getById));
router.patch('/:id/read', authorize(PERMISSIONS.NOTIFICATIONS_WRITE), validateParams(notificationIdParamSchema), asyncHandler(controller.markRead));
router.patch('/:id/archive', authorize(PERMISSIONS.NOTIFICATIONS_WRITE), validateParams(notificationIdParamSchema), asyncHandler(controller.archive));
router.delete('/:id', authorize(PERMISSIONS.NOTIFICATIONS_WRITE), validateParams(notificationIdParamSchema), asyncHandler(controller.remove));

export { router as notificationRoutes };
