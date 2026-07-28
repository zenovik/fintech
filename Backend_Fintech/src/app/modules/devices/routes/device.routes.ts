import { Router } from 'express';
import { DeviceController } from '../controllers/device.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';

const router = Router();
const controller = new DeviceController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/inventory', authorize(PERMISSIONS.TERMINAL_INVENTORY_READ), asyncHandler(controller.inventory));
router.get('/', authorize(PERMISSIONS.DEVICES_READ), asyncHandler(controller.list));
router.post('/', authorize(PERMISSIONS.DEVICES_WRITE), asyncHandler(controller.provision));
router.get('/:id', authorize(PERMISSIONS.DEVICES_READ), asyncHandler(controller.getById));
router.post('/:id/activate', authorize(PERMISSIONS.DEVICES_MANAGE), asyncHandler(controller.activate));
router.post('/:id/deactivate', authorize(PERMISSIONS.DEVICES_MANAGE), asyncHandler(controller.deactivate));
router.post('/:id/transfer', authorize(PERMISSIONS.DEVICES_MANAGE), asyncHandler(controller.transfer));
router.post('/:id/replace', authorize(PERMISSIONS.DEVICES_MANAGE), asyncHandler(controller.replace));
router.post('/:id/sync', authorize(PERMISSIONS.DEVICES_WRITE), asyncHandler(controller.sync));

export { router as deviceRoutes };
