import { Router } from 'express';
import { SupportController } from '../controllers/support.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import { validateBody, validateParams, validateQuery } from '../validators/support.validator';
import {
  addAttachmentBodySchema, addNoteBodySchema, assignTicketBodySchema, createTicketBodySchema,
  escalateTicketBodySchema, ticketIdParamSchema, ticketListQuerySchema, updateTicketBodySchema,
} from '../dto';

const router = Router();
const controller = new SupportController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/statistics', authorize(PERMISSIONS.SUPPORT_READ), asyncHandler(controller.statistics));
router.get('/', authorize(PERMISSIONS.SUPPORT_READ), validateQuery(ticketListQuerySchema), asyncHandler(controller.list));
router.post('/', authorize(PERMISSIONS.SUPPORT_WRITE), validateBody(createTicketBodySchema), asyncHandler(controller.create));
router.get('/:id', authorize(PERMISSIONS.SUPPORT_READ), validateParams(ticketIdParamSchema), asyncHandler(controller.getById));
router.put('/:id', authorize(PERMISSIONS.SUPPORT_WRITE), validateParams(ticketIdParamSchema), validateBody(updateTicketBodySchema), asyncHandler(controller.update));
router.post('/:id/assign', authorize(PERMISSIONS.SUPPORT_MANAGE), validateParams(ticketIdParamSchema), validateBody(assignTicketBodySchema), asyncHandler(controller.assign));
router.post('/:id/reassign', authorize(PERMISSIONS.SUPPORT_MANAGE), validateParams(ticketIdParamSchema), validateBody(assignTicketBodySchema), asyncHandler(controller.reassign));
router.post('/:id/escalate', authorize(PERMISSIONS.SUPPORT_MANAGE), validateParams(ticketIdParamSchema), validateBody(escalateTicketBodySchema), asyncHandler(controller.escalate));
router.post('/:id/close', authorize(PERMISSIONS.SUPPORT_MANAGE), validateParams(ticketIdParamSchema), asyncHandler(controller.close));
router.post('/:id/reopen', authorize(PERMISSIONS.SUPPORT_MANAGE), validateParams(ticketIdParamSchema), asyncHandler(controller.reopen));
router.post('/:id/notes', authorize(PERMISSIONS.SUPPORT_WRITE), validateParams(ticketIdParamSchema), validateBody(addNoteBodySchema), asyncHandler(controller.addNote));
router.post('/:id/attachments', authorize(PERMISSIONS.SUPPORT_WRITE), validateParams(ticketIdParamSchema), validateBody(addAttachmentBodySchema), asyncHandler(controller.addAttachment));

export { router as supportRoutes };
