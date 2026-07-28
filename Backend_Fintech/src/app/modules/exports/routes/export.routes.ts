import { Router } from 'express';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import { ExportController } from '../controllers/export.controller';

const router = Router();
const controller = new ExportController();

router.use(authenticate);
router.use(requireOrganization());
router.get('/:fileId', asyncHandler(controller.download));

export { router as exportRoutes };
