import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { PublicPaymentLinkController } from '../controllers/payment-link.controller';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import { validateBody, validateParams } from '../validators/payment-links.validator';
import { publicPayBodySchema, publicTokenParamSchema } from '../dto';

const router = Router();
const controller = new PublicPaymentLinkController();

const payLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many payment attempts', code: 'RATE_LIMITED' },
});

router.get('/:token', validateParams(publicTokenParamSchema), asyncHandler(controller.getByToken));
router.post('/:token/pay', payLimiter, validateParams(publicTokenParamSchema), validateBody(publicPayBodySchema), asyncHandler(controller.pay));

export { router as publicPaymentLinkRoutes };
