import { Router } from 'express';
import { RoleController } from '../controllers/role.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import { validateBody, validateParams, validateQuery } from '../validators/role.validator';
import {
  assignRolePermissionsBodySchema,
  createRoleBodySchema,
  roleIdParamSchema,
  roleListQuerySchema,
  updateRoleBodySchema,
} from '../dto';

const router = Router();
const controller = new RoleController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/', authorize(PERMISSIONS.ROLES_READ), validateQuery(roleListQuerySchema), asyncHandler(controller.list));
router.post('/', authorize(PERMISSIONS.ROLES_WRITE), validateBody(createRoleBodySchema), asyncHandler(controller.create));
router.get('/:id', authorize(PERMISSIONS.ROLES_READ), validateParams(roleIdParamSchema), asyncHandler(controller.getById));
router.put('/:id', authorize(PERMISSIONS.ROLES_WRITE), validateParams(roleIdParamSchema), validateBody(updateRoleBodySchema), asyncHandler(controller.update));
router.delete('/:id', authorize(PERMISSIONS.ROLES_DELETE), validateParams(roleIdParamSchema), asyncHandler(controller.remove));
router.put('/:id/permissions', authorize(PERMISSIONS.PERMISSIONS_MANAGE), validateParams(roleIdParamSchema), validateBody(assignRolePermissionsBodySchema), asyncHandler(controller.assignPermissions));

export { router as roleRoutes };
