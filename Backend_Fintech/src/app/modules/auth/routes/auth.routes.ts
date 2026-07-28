import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../../../shared/helpers/async-handler';
import { validateBody } from '../validators/auth.validator';
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  selectOrganizationSchema,
  verifyOtpSchema,
  resendOtpSchema,
  changePasswordSchema,
  mfaPreferencesSchema,
} from '../dto';
import { issueCsrfToken } from '../../../shared/middleware/csrf.middleware';

const router = Router();
const controller = new AuthController();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    code: 'RATE_LIMITED',
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts', code: 'RATE_LIMITED' },
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many OTP requests', code: 'RATE_LIMITED' },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many password reset requests', code: 'RATE_LIMITED' },
});

router.use(authLimiter);

router.get('/csrf-token', issueCsrfToken);
router.post('/login', loginLimiter, validateBody(loginSchema), asyncHandler(controller.login));
router.post('/verify-otp', otpLimiter, validateBody(verifyOtpSchema), asyncHandler(controller.verifyOtp));
router.post('/resend-otp', otpLimiter, validateBody(resendOtpSchema), asyncHandler(controller.resendOtp));
router.post('/forgot-password', forgotPasswordLimiter, validateBody(forgotPasswordSchema), asyncHandler(controller.forgotPassword));
router.post('/reset-password', validateBody(resetPasswordSchema), asyncHandler(controller.resetPassword));
router.post('/refresh-token', validateBody(refreshTokenSchema), asyncHandler(controller.refreshToken));
router.post('/select-organization', authenticate, validateBody(selectOrganizationSchema), asyncHandler(controller.selectOrganization));

router.post('/logout', authenticate, asyncHandler(controller.logout));
router.get('/me', authenticate, asyncHandler(controller.me));
router.get('/sessions', authenticate, asyncHandler(controller.getSessions));
router.delete('/sessions/others', authenticate, asyncHandler(controller.revokeOtherSessions));
router.delete('/session/:id', authenticate, asyncHandler(controller.revokeSession));
router.post('/change-password', authenticate, validateBody(changePasswordSchema), asyncHandler(controller.changePassword));
router.put('/mfa-preferences', authenticate, validateBody(mfaPreferencesSchema), asyncHandler(controller.updateMfaPreferences));
router.get('/session-settings', authenticate, asyncHandler(controller.getSessionSettings));

export const authRoutes = router;
