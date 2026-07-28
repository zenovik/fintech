export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: 'fintech_access_token',
  TOKEN_EXPIRY: 'fintech_token_expiry',
  USER: 'fintech_user',
  MFA_CHALLENGE: 'fintech_mfa_challenge',
  REMEMBER_DEVICE: 'fintech_remember_device',
  RETURN_URL: 'fintech_return_url',
} as const;

export const AUTH_ROUTES = {
  LOGIN: '/auth/login',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_OTP: '/auth/verify-otp',
  SESSION_EXPIRED: '/auth/session-expired',
  ACCESS_DENIED: '/auth/access-denied',
  SESSIONS: '/auth/sessions',
} as const;

export const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  UPPERCASE: /[A-Z]/,
  NUMBER_OR_SPECIAL: /[0-9!@#$%^&*(),.?":{}|<>]/,
} as const;

export const OTP_LENGTH = 6;

export const HTTP_ERROR_MESSAGES: Record<number, string> = {
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  422: 'Validation failed. Please check your input.',
  429: 'Too many requests. Please wait and try again.',
  500: 'An unexpected server error occurred. Please try again later.',
};
