import { Router } from 'express';
import { GatewayController } from '../controllers/gateway.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';

const router = Router();
const controller = new GatewayController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/providers', authorize(PERMISSIONS.GATEWAY_READ), asyncHandler(controller.listProviders));
router.get('/transactions', authorize(PERMISSIONS.GATEWAY_READ), asyncHandler(controller.listTransactions));
router.post('/webhooks/:provider/verify', authorize(PERMISSIONS.GATEWAY_MANAGE), asyncHandler(controller.verifyWebhook));

export { router as gatewayRoutes };
