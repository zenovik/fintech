export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
  code?: string;
}

export interface AuthRole {
  id: number;
  uuid: string;
  code: string;
  name: string;
}

export interface AuthUser {
  uuid: string;
  email: string;
  firstName: string;
  lastName: string;
  mfaEnabled: boolean;
  roles?: AuthRole[];
  permissions?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberDevice?: boolean;
  deviceFingerprint?: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: string;
  user: AuthUser;
  organizations?: Array<{
    id: number;
    uuid: string;
    code: string;
    displayName: string;
    logoInitials: string | null;
    primaryColor: string | null;
    isDefault: boolean;
    roleCode: string;
  }>;
  requiresOrganizationSelection?: boolean;
}

export interface MfaChallenge {
  challengeId: string;
  nextStep: 'otp' | 'totp';
  maskedDestination?: string;
  expiresAt: string;
}

export interface VerifyOtpRequest {
  challengeId: string;
  otp: string;
  trustDevice?: boolean;
  deviceFingerprint?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserProfile extends AuthUser {
  phoneNumber: string | null;
  mfaMethod: string;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
  roles: AuthRole[];
  permissions: string[];
}

export interface SessionItem {
  id: string;
  deviceName: string | null;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  location: string | null;
  status: string;
  isCurrent: boolean;
  lastActiveAt: string;
  createdAt: string;
}

export interface ResendOtpResponse {
  message: string;
  resendAvailableAt: string;
}
