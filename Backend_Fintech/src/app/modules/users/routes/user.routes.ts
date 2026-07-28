import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import { validateBody, validateParams, validateQuery } from '../validators/user.validator';
import {
  assignUserRolesBodySchema,
  createUserBodySchema,
  updateUserBodySchema,
  updateUserStatusBodySchema,
  userIdParamSchema,
  userListQuerySchema,
} from '../dto';

const router = Router();
const controller = new UserController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/', authorize(PERMISSIONS.USERS_READ), validateQuery(userListQuerySchema), asyncHandler(controller.list));
router.post('/', authorize(PERMISSIONS.USERS_WRITE), validateBody(createUserBodySchema), asyncHandler(controller.create));
router.get('/:id', authorize(PERMISSIONS.USERS_READ), validateParams(userIdParamSchema), asyncHandler(controller.getById));
router.put('/:id', authorize(PERMISSIONS.USERS_WRITE), validateParams(userIdParamSchema), validateBody(updateUserBodySchema), asyncHandler(controller.update));
router.patch('/:id/status', authorize(PERMISSIONS.USERS_WRITE), validateParams(userIdParamSchema), validateBody(updateUserStatusBodySchema), asyncHandler(controller.updateStatus));
router.delete('/:id', authorize(PERMISSIONS.USERS_DELETE), validateParams(userIdParamSchema), asyncHandler(controller.remove));
router.put('/:id/roles', authorize(PERMISSIONS.USERS_WRITE), validateParams(userIdParamSchema), validateBody(assignUserRolesBodySchema), asyncHandler(controller.assignRoles));

export { router as userRoutes };
