import { Router } from 'express';
import { PermissionController } from '../controllers/permission.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';

const router = Router();
const controller = new PermissionController();

router.use(authenticate);
router.get('/', authorize(PERMISSIONS.PERMISSIONS_READ), asyncHandler(controller.list));

export { router as permissionRoutes };
