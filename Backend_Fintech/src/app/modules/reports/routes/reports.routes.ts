import { Router } from 'express';
import { ReportsController } from '../controllers/reports.controller';
import { ReportCenterController } from '../controllers/report-center.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import { validateBody, validateParams, validateQuery } from '../validators/reports.validator';
import {
  createReportBodySchema,
  createScheduledBodySchema,
  exportReportBodySchema,
  historyQuerySchema,
  reportIdParamSchema,
  reportListQuerySchema,
  runReportBodySchema,
  scheduledIdParamSchema,
  updateReportBodySchema,
  updateScheduledBodySchema,
} from '../dto';

const router = Router();
const controller = new ReportsController();
const centerController = new ReportCenterController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/center/catalog', authorize(PERMISSIONS.REPORTS_READ), asyncHandler(centerController.catalog));
router.get('/center/saved-filters', authorize(PERMISSIONS.REPORTS_READ), asyncHandler(centerController.savedFilters));
router.post('/center/saved-filters', authorize(PERMISSIONS.REPORTS_WRITE), asyncHandler(centerController.saveFilter));
router.delete('/center/saved-filters/:id', authorize(PERMISSIONS.REPORTS_WRITE), asyncHandler(centerController.deleteFilter));
router.post('/center/generate', authorize(PERMISSIONS.REPORTS_READ), asyncHandler(centerController.generate));
router.post('/center/export', authorize(PERMISSIONS.REPORTS_EXPORT), asyncHandler(centerController.exportReport));
router.get('/center/export-history', authorize(PERMISSIONS.REPORTS_READ), asyncHandler(centerController.exportHistory));

router.get('/templates', authorize(PERMISSIONS.REPORTS_READ), asyncHandler(controller.templates));
router.get('/categories', authorize(PERMISSIONS.REPORTS_READ), asyncHandler(controller.categories));
router.get('/history', authorize(PERMISSIONS.REPORTS_READ), validateQuery(historyQuerySchema), asyncHandler(controller.history));
router.get('/scheduled', authorize(PERMISSIONS.REPORTS_READ), asyncHandler(controller.scheduled));
router.post('/scheduled', authorize(PERMISSIONS.REPORTS_WRITE), validateBody(createScheduledBodySchema), asyncHandler(controller.createScheduled));
router.put('/scheduled/:id', authorize(PERMISSIONS.REPORTS_WRITE), validateParams(scheduledIdParamSchema), validateBody(updateScheduledBodySchema), asyncHandler(controller.updateScheduled));
router.delete('/scheduled/:id', authorize(PERMISSIONS.REPORTS_WRITE), validateParams(scheduledIdParamSchema), asyncHandler(controller.deleteScheduled));
router.post('/run', authorize(PERMISSIONS.REPORTS_WRITE), validateBody(runReportBodySchema), asyncHandler(controller.run));
router.post('/export', authorize(PERMISSIONS.REPORTS_EXPORT), validateBody(exportReportBodySchema), asyncHandler(controller.export));
router.get('/', authorize(PERMISSIONS.REPORTS_READ), validateQuery(reportListQuerySchema), asyncHandler(controller.list));
router.post('/', authorize(PERMISSIONS.REPORTS_WRITE), validateBody(createReportBodySchema), asyncHandler(controller.create));
router.get('/:id', authorize(PERMISSIONS.REPORTS_READ), validateParams(reportIdParamSchema), asyncHandler(controller.getById));
router.put('/:id', authorize(PERMISSIONS.REPORTS_WRITE), validateParams(reportIdParamSchema), validateBody(updateReportBodySchema), asyncHandler(controller.update));
router.delete('/:id', authorize(PERMISSIONS.REPORTS_WRITE), validateParams(reportIdParamSchema), asyncHandler(controller.delete));

export { router as reportRoutes };
