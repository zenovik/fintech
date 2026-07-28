import { RowDataPacket, ResultSetHeader } from 'mysql2';

export type DbRow = RowDataPacket;
export type DbResult = ResultSetHeader;

export interface UserRecord extends RowDataPacket {
  id: number;
  uuid: string;
  email: string;
  password_hash: string | null;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  phone_verified_at: Date | null;
  email_verified_at: Date | null;
  mfa_enabled: number;
  mfa_method: 'none' | 'totp' | 'sms' | 'both';
  totp_secret: string | null;
  status: 'active' | 'locked' | 'pending' | 'inactive';
  failed_login_attempts: number;
  locked_until: Date | null;
  password_changed_at: Date | null;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface SessionRecord extends RowDataPacket {
  id: number;
  uuid: string;
  user_id: number;
  trusted_device_id: number | null;
  ip_address: string | null;
  user_agent: string | null;
  device_name: string | null;
  browser: string | null;
  os: string | null;
  location_city: string | null;
  location_country: string | null;
  status: 'active' | 'revoked' | 'expired';
  last_activity_at: Date;
  expires_at: Date;
  trusted_until: Date | null;
  revoked_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface RefreshTokenRecord extends RowDataPacket {
  id: number;
  user_id: number;
  session_id: number;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  replaced_by_token_id: number | null;
  created_at: Date;
}

export interface AuthChallengeRecord extends RowDataPacket {
  id: number;
  uuid: string;
  user_id: number;
  session_id: number | null;
  challenge_type: 'mfa_totp' | 'mfa_sms' | 'login_stepup';
  status: 'pending' | 'verified' | 'expired' | 'cancelled';
  remember_device: number;
  expires_at: Date;
  verified_at: Date | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface OtpRecord extends RowDataPacket {
  id: number;
  user_id: number;
  challenge_id: number | null;
  purpose: 'login_stepup' | 'mfa_sms' | 'mfa_totp' | 'password_reset';
  otp_hash: string;
  channel: 'sms' | 'email' | 'totp';
  destination_masked: string | null;
  attempts: number;
  max_attempts: number;
  expires_at: Date;
  verified_at: Date | null;
  last_sent_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface PasswordResetTokenRecord extends RowDataPacket {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  requested_ip: string | null;
  created_at: Date;
}

export interface TrustedDeviceRecord extends RowDataPacket {
  id: number;
  user_id: number;
  device_fingerprint: string;
  device_label: string | null;
  trusted_until: Date;
  last_used_at: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresAt: Date;
}

export interface AuthUserPayload {
  sub: number;
  uuid: string;
  email: string;
  sessionId: number;
  sessionUuid: string;
  organizationId?: number;
  organizationRoleCode?: string;
  merchantId?: number;
  merchantRoleCode?: string;
  outletIds?: number[];
  permissions?: string[];
}

export interface LoginSuccessResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: {
    id: number;
    uuid: string;
    email: string;
    firstName: string;
    lastName: string;
    mfaEnabled: boolean;
  };
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

export interface MfaChallengeResponse {
  challengeId: string;
  nextStep: 'otp' | 'totp';
  maskedDestination?: string;
  expiresAt: string;
}
