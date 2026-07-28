import { Router } from 'express';
import { DeveloperController } from '../controllers/developer.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import { validateBody } from '../../auth/validators/auth.validator';
import {
  createProfileSchema,
  updateProfileSchema,
  createOAuthAppSchema,
  updateOAuthAppSchema,
} from '../dto/developer.dto';

const router = Router();
const controller = new DeveloperController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/dashboard', authorize(PERMISSIONS.DEVELOPER_READ), asyncHandler(controller.dashboard));
router.get('/profiles', authorize(PERMISSIONS.DEVELOPER_READ), asyncHandler(controller.listProfiles));
router.post('/profiles', authorize(PERMISSIONS.DEVELOPER_WRITE), validateBody(createProfileSchema), asyncHandler(controller.createProfile));
router.get('/profiles/:id', authorize(PERMISSIONS.DEVELOPER_READ), asyncHandler(controller.getProfile));
router.put('/profiles/:id', authorize(PERMISSIONS.DEVELOPER_WRITE), validateBody(updateProfileSchema), asyncHandler(controller.updateProfile));
router.delete('/profiles/:id', authorize(PERMISSIONS.DEVELOPER_MANAGE), asyncHandler(controller.deleteProfile));
router.get('/oauth-apps', authorize(PERMISSIONS.DEVELOPER_READ), asyncHandler(controller.listOAuthApps));
router.post('/oauth-apps', authorize(PERMISSIONS.DEVELOPER_WRITE), validateBody(createOAuthAppSchema), asyncHandler(controller.createOAuthApp));
router.get('/oauth-apps/:id', authorize(PERMISSIONS.DEVELOPER_READ), asyncHandler(controller.getOAuthApp));
router.put('/oauth-apps/:id', authorize(PERMISSIONS.DEVELOPER_WRITE), validateBody(updateOAuthAppSchema), asyncHandler(controller.updateOAuthApp));
router.post('/oauth-apps/:id/revoke', authorize(PERMISSIONS.DEVELOPER_MANAGE), asyncHandler(controller.revokeOAuthApp));
router.get('/api-usage', authorize(PERMISSIONS.DEVELOPER_READ), asyncHandler(controller.listApiUsageLogs));
router.get('/api-keys', authorize(PERMISSIONS.DEVELOPER_READ), asyncHandler(controller.listApiKeys));

export { router as developerRoutes };
