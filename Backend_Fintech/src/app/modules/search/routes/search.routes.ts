import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';

const router = Router();
const controller = new SearchController();

router.use(authenticate);
router.use(requireOrganization());
router.get('/', authorize(PERMISSIONS.GLOBAL_SEARCH_READ), asyncHandler(controller.search));

export { router as searchRoutes };
