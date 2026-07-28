import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import { validateParams, validateQuery } from '../validators/audit.validator';
import {
  auditListQuerySchema,
  auditIdParamSchema,
  auditExportQuerySchema,
  apiLogListQuerySchema,
  webhookLogListQuerySchema,
} from '../dto';

const router = Router();
const controller = new AuditController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/', authorize(PERMISSIONS.AUDIT_READ), validateQuery(auditListQuerySchema), asyncHandler(controller.list));
router.get('/export', authorize(PERMISSIONS.AUDIT_EXPORT), validateQuery(auditExportQuerySchema), asyncHandler(controller.exportLogs));
router.get('/categories', authorize(PERMISSIONS.AUDIT_READ), asyncHandler(controller.getCategories));
router.get('/actions', authorize(PERMISSIONS.AUDIT_READ), asyncHandler(controller.getActions));
router.get('/api-logs', authorize(PERMISSIONS.AUDIT_READ), validateQuery(apiLogListQuerySchema), asyncHandler(controller.listApiLogs));
router.get('/webhook-logs', authorize(PERMISSIONS.AUDIT_READ), validateQuery(webhookLogListQuerySchema), asyncHandler(controller.listWebhookLogs));
router.get('/:id', authorize(PERMISSIONS.AUDIT_READ), validateParams(auditIdParamSchema), asyncHandler(controller.getById));

export { router as auditRoutes };
