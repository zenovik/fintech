import { Router } from 'express';
import { PaymentConfigController } from '../controllers/payment-config.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';

const router = Router();
const controller = new PaymentConfigController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/limits', authorize(PERMISSIONS.PAYMENT_CONFIG_READ), asyncHandler(controller.listLimits));
router.post('/limits', authorize(PERMISSIONS.PAYMENT_CONFIG_WRITE), asyncHandler(controller.saveLimit));
router.get('/merchants/:merchantId', authorize(PERMISSIONS.PAYMENT_CONFIG_READ), asyncHandler(controller.getMerchantConfig));
router.put('/merchants/:merchantId', authorize(PERMISSIONS.PAYMENT_CONFIG_WRITE), asyncHandler(controller.saveConfig));

export { router as paymentConfigRoutes };
