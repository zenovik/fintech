import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { CheckoutController, PublicCheckoutController } from '../controllers/checkout.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { requireOrganization } from '../../../shared/middleware/organization.middleware';
import { authorize } from '../../../shared/middleware/authorize.middleware';
import { PERMISSIONS } from '../../../shared/rbac/permissions';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import { validateBody, validateParams } from '../../../shared/validators/zod-validator';
import {
  checkoutIdParamSchema, checkoutPayBodySchema, checkoutRefParamSchema,
  createCheckoutSessionBodySchema, merchantIdParamSchema, recoveryTokenParamSchema,
} from '../dto/checkout.dto';

const router = Router();
const controller = new CheckoutController();

router.use(authenticate);
router.use(requireOrganization());

router.get('/themes', authorize(PERMISSIONS.CHECKOUT_READ), asyncHandler(controller.listThemes));
router.get('/analytics', authorize(PERMISSIONS.CHECKOUT_ANALYTICS), asyncHandler(controller.analytics));
router.get('/sessions', authorize(PERMISSIONS.CHECKOUT_READ), asyncHandler(controller.list));
router.post('/sessions', authorize(PERMISSIONS.CHECKOUT_WRITE), validateBody(createCheckoutSessionBodySchema), asyncHandler(controller.create));
router.get('/sessions/:id', authorize(PERMISSIONS.CHECKOUT_READ), validateParams(checkoutIdParamSchema), asyncHandler(controller.getById));
router.get('/branding/:merchantId', authorize(PERMISSIONS.CHECKOUT_BRANDING), validateParams(merchantIdParamSchema), asyncHandler(controller.getBranding));
router.put('/branding/:merchantId', authorize(PERMISSIONS.CHECKOUT_BRANDING), validateParams(merchantIdParamSchema), asyncHandler(controller.updateBranding));

export { router as checkoutRoutes };

const publicRouter = Router();
const publicController = new PublicCheckoutController();

const checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many checkout requests', code: 'RATE_LIMITED' },
});

const payLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many payment attempts', code: 'RATE_LIMITED' },
});

const recoverLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many recovery attempts', code: 'RATE_LIMITED' },
});

const cancelLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many cancel requests', code: 'RATE_LIMITED' },
});

publicRouter.use(checkoutLimiter);
publicRouter.get('/recover/:token', recoverLimiter, validateParams(recoveryTokenParamSchema), asyncHandler(publicController.recover));
publicRouter.get('/:ref', validateParams(checkoutRefParamSchema), asyncHandler(publicController.getCheckout));
publicRouter.post('/:ref/pay', payLimiter, validateParams(checkoutRefParamSchema), validateBody(checkoutPayBodySchema), asyncHandler(publicController.pay));
publicRouter.post('/:ref/retry', payLimiter, validateParams(checkoutRefParamSchema), validateBody(checkoutPayBodySchema), asyncHandler(publicController.retry));
publicRouter.post('/:ref/cancel', cancelLimiter, validateParams(checkoutRefParamSchema), asyncHandler(publicController.cancel));

export { publicRouter as publicCheckoutRoutes };
