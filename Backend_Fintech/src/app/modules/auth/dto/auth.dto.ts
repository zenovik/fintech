import { z } from 'zod';

const emailSchema = z.string().trim().email('Invalid email address').max(255);
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one number or special character');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberDevice: z.boolean().optional().default(false),
  deviceFingerprint: z.string().max(255).optional(),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1).optional(),
  organizationId: z.coerce.number().int().min(1).optional(),
}).passthrough();

export const selectOrganizationSchema = z.object({
  organizationId: z.number().int().min(1),
});

export const verifyOtpSchema = z.object({
  challengeId: z.string().uuid('Invalid challenge ID'),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
  trustDevice: z.boolean().optional().default(false),
  deviceFingerprint: z.string().max(255).optional(),
});

export const resendOtpSchema = z.object({
  challengeId: z.string().uuid('Invalid challenge ID'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const mfaPreferencesSchema = z.object({
  mfaEnabled: z.boolean(),
  mfaMethod: z.enum(['totp', 'sms', 'both']).optional(),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;
export type SelectOrganizationDto = z.infer<typeof selectOrganizationSchema>;
export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;
export type ResendOtpDto = z.infer<typeof resendOtpSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
export type MfaPreferencesDto = z.infer<typeof mfaPreferencesSchema>;
