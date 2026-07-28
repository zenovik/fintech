import { Router } from 'express';
import { SandboxController } from '../controllers/sandbox.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';

const router = Router();
const controller = new SandboxController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/dashboard', authorize(PERMISSIONS.SANDBOX_READ), asyncHandler(controller.dashboard));
router.get('/accounts', authorize(PERMISSIONS.SANDBOX_READ), asyncHandler(controller.listAccounts));
router.post('/accounts', authorize(PERMISSIONS.SANDBOX_WRITE), asyncHandler(controller.createAccount));
router.get('/accounts/:id', authorize(PERMISSIONS.SANDBOX_READ), asyncHandler(controller.getAccount));
router.put('/accounts/:id', authorize(PERMISSIONS.SANDBOX_WRITE), asyncHandler(controller.updateAccount));
router.delete('/accounts/:id', authorize(PERMISSIONS.SANDBOX_MANAGE), asyncHandler(controller.deleteAccount));
router.get('/test-cards', authorize(PERMISSIONS.SANDBOX_READ), asyncHandler(controller.listTestCards));
router.get('/simulations', authorize(PERMISSIONS.SANDBOX_READ), asyncHandler(controller.listSimulations));
router.post('/simulations', authorize(PERMISSIONS.SANDBOX_WRITE), asyncHandler(controller.createSimulation));
router.get('/simulations/:id', authorize(PERMISSIONS.SANDBOX_READ), asyncHandler(controller.getSimulation));
router.put('/simulations/:id', authorize(PERMISSIONS.SANDBOX_WRITE), asyncHandler(controller.updateSimulation));
router.delete('/simulations/:id', authorize(PERMISSIONS.SANDBOX_MANAGE), asyncHandler(controller.deleteSimulation));

export { router as sandboxRoutes };
