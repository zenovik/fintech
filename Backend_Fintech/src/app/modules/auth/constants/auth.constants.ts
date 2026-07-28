export const AUTH_ROUTES = {
  BASE: '/auth',
  LOGIN: '/login',
  LOGOUT: '/logout',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  REFRESH_TOKEN: '/refresh-token',
  VERIFY_OTP: '/verify-otp',
  RESEND_OTP: '/resend-otp',
  ME: '/me',
  SESSIONS: '/sessions',
  SESSION_BY_ID: '/session/:id',
  SESSIONS_OTHERS: '/sessions/others',
} as const;

export const AUTH_EVENT_TYPES = {
  LOGIN: 'login',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  MFA_VERIFY: 'mfa_verify',
  MFA_FAILED: 'mfa_failed',
  OTP_RESENT: 'otp_resent',
  PASSWORD_RESET_REQUESTED: 'password_reset_requested',
  PASSWORD_RESET_COMPLETED: 'password_reset_completed',
  SESSION_CREATED: 'session_created',
  SESSION_REVOKED: 'session_revoked',
  SESSIONS_REVOKED_OTHERS: 'sessions_revoked_others',
  TOKEN_REFRESHED: 'token_refreshed',
  TOKEN_REUSE_DETECTED: 'token_reuse_detected',
} as const;

export const PASSWORD_REGEX = {
  MIN_LENGTH: 8,
  UPPERCASE: /[A-Z]/,
  NUMBER_OR_SPECIAL: /[0-9!@#$%^&*(),.?":{}|<>]/,
};

export const OTP_LENGTH = 6;

export const CHALLENGE_TYPES = {
  MFA_TOTP: 'mfa_totp',
  MFA_SMS: 'mfa_sms',
  LOGIN_STEPUP: 'login_stepup',
} as const;

export const SESSION_STATUS = {
  ACTIVE: 'active',
  REVOKED: 'revoked',
  EXPIRED: 'expired',
} as const;

export const USER_STATUS = {
  ACTIVE: 'active',
  LOCKED: 'locked',
  PENDING: 'pending',
  INACTIVE: 'inactive',
} as const;
