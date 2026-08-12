import { Router } from 'express';
import { EventsController } from '../controllers/events.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';

const router = Router();
const controller = new EventsController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/dead-letter', authorize(PERMISSIONS.EVENTS_READ), asyncHandler(controller.listDeadLetter));
router.post('/dead-letter/:id/replay', authorize(PERMISSIONS.EVENTS_REPLAY), asyncHandler(controller.replayDeadLetter));
router.post('/publish', authorize(PERMISSIONS.EVENTS_REPLAY), asyncHandler(controller.publishTest));

export { router as eventsRoutes };
