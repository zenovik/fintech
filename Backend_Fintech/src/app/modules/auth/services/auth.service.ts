import { randomUUID } from 'node:crypto';
import { verifySync } from 'otplib';
import { env } from '../../../config';
import {
  generateOtp,
  sha256,
  maskPhone,
  buildDeviceFingerprint,
  parseUserAgent,
} from '../../../shared/helpers/crypto.helper';
import { logger } from '../../../shared/logger';
import {
  UnauthorizedError,
  AccountLockedError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  GoneError,
  TooManyRequestsError,
} from '../../../shared/exceptions/app.exception';
import { AUTH_EVENT_TYPES, CHALLENGE_TYPES, USER_STATUS } from '../constants/auth.constants';
import { PermissionRepository } from '../../../shared/rbac/permission.repository';
import { SettingsRepository } from '../../settings/repositories/settings.repository';
import { backgroundJobService } from '../../../shared/jobs/background-job.service';
import { buildPasswordResetUrl } from '../../../shared/helpers/password-reset.helper';
import { UserRepository } from '../repositories/user.repository';
import { SessionRepository } from '../repositories/session.repository';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { ChallengeRepository } from '../repositories/challenge.repository';
import { OtpRepository } from '../repositories/otp.repository';
import { PasswordResetRepository } from '../repositories/password-reset.repository';
import { TrustedDeviceRepository } from '../repositories/trusted-device.repository';
import { LoginAttemptRepository } from '../repositories/login-attempt.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { PasswordHistoryRepository } from '../repositories/password-history.repository';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { notificationDispatch } from '../../notifications';
import { auditRecorder } from '../../audit';
import { enrichAuthPayload } from './auth-context.builder';
import { OrganizationRepository } from '../../organizations/repositories/organization.repository';
import {
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyOtpDto,
  ResendOtpDto,
  ChangePasswordDto,
  MfaPreferencesDto,
} from '../dto';
import {
  LoginSuccessResponse,
  MfaChallengeResponse,
  UserRecord,
  AuthUserPayload,
} from '../types/auth.types';

interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
}

export class AuthService {
  constructor(
    private readonly userRepo = new UserRepository(),
    private readonly sessionRepo = new SessionRepository(),
    private readonly refreshTokenRepo = new RefreshTokenRepository(),
    private readonly challengeRepo = new ChallengeRepository(),
    private readonly otpRepo = new OtpRepository(),
    private readonly passwordResetRepo = new PasswordResetRepository(),
    private readonly trustedDeviceRepo = new TrustedDeviceRepository(),
    private readonly loginAttemptRepo = new LoginAttemptRepository(),
    private readonly auditRepo = new AuditRepository(),
    private readonly passwordHistoryRepo = new PasswordHistoryRepository(),
    private readonly passwordService = new PasswordService(),
    private readonly tokenService = new TokenService(),
    private readonly permissionRepo = new PermissionRepository(),
    private readonly settingsRepo = new SettingsRepository(),
    private readonly organizationRepo = new OrganizationRepository(),
  ) {}

  private async withOrganizations(
    userId: number,
    base: LoginSuccessResponse,
    hasOrgInToken = false,
  ): Promise<LoginSuccessResponse> {
    const memberships = await this.organizationRepo.findMembershipsByUserId(userId);
    const organizations = memberships.map((m) => ({
      id: m.id,
      uuid: m.uuid,
      code: m.code,
      displayName: m.displayName,
      logoInitials: m.logoInitials,
      primaryColor: m.primaryColor,
      isDefault: m.isDefault,
      roleCode: m.roleCode,
    }));
    return {
      ...base,
      organizations,
      requiresOrganizationSelection: organizations.length > 1 && !hasOrgInToken,
    };
  }

  private async resolveOrgForUser(
    userId: number,
    organizationId?: number,
  ): Promise<{ organizationId: number; organizationRoleCode: string } | undefined> {
    const memberships = await this.organizationRepo.findMembershipsByUserId(userId);
    if (memberships.length === 0) return undefined;
    if (organizationId) {
      const membership = memberships.find((m) => m.id === organizationId);
      if (!membership) throw new ForbiddenError('You do not have access to this organization');
      return { organizationId: membership.id, organizationRoleCode: membership.roleCode };
    }
    if (memberships.length === 1) {
      return { organizationId: memberships[0].id, organizationRoleCode: memberships[0].roleCode };
    }
    return undefined;
  }

  private buildAuthPayload(
    user: Pick<UserRecord, 'id' | 'uuid' | 'email'>,
    sessionId: number,
    sessionUuid: string,
    org?: { organizationId: number; organizationRoleCode: string },
  ): AuthUserPayload {
    return {
      sub: user.id,
      uuid: user.uuid,
      email: user.email,
      sessionId,
      sessionUuid,
      ...(org ? { organizationId: org.organizationId, organizationRoleCode: org.organizationRoleCode } : {}),
    };
  }

  async login(dto: LoginDto, ctx: RequestContext): Promise<LoginSuccessResponse | MfaChallengeResponse> {
    const user = await this.userRepo.findByEmail(dto.email.toLowerCase());

    if (!user) {
      await this.loginAttemptRepo.create({
        email: dto.email,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        success: false,
        failureReason: 'invalid_credentials',
      });
      void auditRecorder.loginFailed(dto.email, { ipAddress: ctx.ipAddress, userAgent: ctx.userAgent }).catch(() => {});
      throw new UnauthorizedError('Invalid email or password');
    }

    await this.userRepo.unlockIfExpired(user.id);
    const refreshedUser = (await this.userRepo.findById(user.id))!;

    if (refreshedUser.status === USER_STATUS.LOCKED) {
      if (refreshedUser.locked_until && refreshedUser.locked_until > new Date()) {
        throw new AccountLockedError('Account is temporarily locked. Please try again later.');
      }
    }

    if (refreshedUser.status !== USER_STATUS.ACTIVE) {
      throw new UnauthorizedError('Account is not active');
    }

    if (!refreshedUser.password_hash) {
      throw new UnauthorizedError('Password login is not available for this account');
    }

    const passwordValid = await this.passwordService.compare(dto.password, refreshedUser.password_hash);
    if (!passwordValid) {
      await this.userRepo.incrementFailedAttempts(refreshedUser.id);
      await this.loginAttemptRepo.create({
        userId: refreshedUser.id,
        email: dto.email,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        success: false,
        failureReason: 'invalid_credentials',
      });
      await this.auditRepo.log({
        userId: refreshedUser.id,
        eventType: AUTH_EVENT_TYPES.LOGIN_FAILED,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { reason: 'invalid_credentials' },
      });
      void auditRecorder.loginFailed(dto.email, { userId: refreshedUser.id, ipAddress: ctx.ipAddress, userAgent: ctx.userAgent }).catch(() => {});

      if (refreshedUser.failed_login_attempts + 1 >= env.auth.maxLoginAttempts) {
        const lockedUntil = new Date(Date.now() + env.auth.lockDurationMinutes * 60 * 1000);
        await this.userRepo.lockAccount(refreshedUser.id, lockedUntil);
      }

      throw new UnauthorizedError('Invalid email or password');
    }

    const fingerprint =
      dto.deviceFingerprint ??
      (ctx.userAgent && ctx.ipAddress
        ? buildDeviceFingerprint(ctx.userAgent, ctx.ipAddress)
        : undefined);

    const isTrusted =
      fingerprint != null
        ? !!(await this.trustedDeviceRepo.findValid(refreshedUser.id, fingerprint))
        : false;

    const mfaRequired =
      refreshedUser.mfa_enabled === 1 &&
      !isTrusted &&
      (refreshedUser.mfa_method === 'totp' ||
        refreshedUser.mfa_method === 'sms' ||
        refreshedUser.mfa_method === 'both');

    if (mfaRequired) {
      return this.createMfaChallenge(refreshedUser, dto.rememberDevice ?? false, ctx);
    }

    return this.completeLogin(refreshedUser, dto.rememberDevice ?? false, ctx, fingerprint);
  }

  private async createMfaChallenge(
    user: UserRecord,
    rememberDevice: boolean,
    ctx: RequestContext,
  ): Promise<MfaChallengeResponse> {
    const challengeUuid = randomUUID();
    const expiresAt = new Date(Date.now() + env.auth.otpExpiryMinutes * 60 * 1000);

    let challengeType: 'mfa_totp' | 'mfa_sms' | 'login_stepup' = CHALLENGE_TYPES.MFA_TOTP;
    let nextStep: 'otp' | 'totp' = 'totp';
    let maskedDestination: string | undefined;

    if (user.mfa_method === 'sms') {
      challengeType = CHALLENGE_TYPES.MFA_SMS;
      nextStep = 'otp';
    } else if (user.mfa_method === 'both') {
      challengeType = CHALLENGE_TYPES.MFA_TOTP;
      nextStep = 'totp';
    }

    const challengeId = await this.challengeRepo.create({
      uuid: challengeUuid,
      userId: user.id,
      challengeType,
      rememberDevice,
      expiresAt,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    if (challengeType === CHALLENGE_TYPES.MFA_SMS || user.mfa_method === 'sms') {
      const otp = generateOtp();
      await this.otpRepo.create({
        userId: user.id,
        challengeId,
        purpose: 'mfa_sms',
        otpHash: sha256(otp),
        channel: 'sms',
        destinationMasked: user.phone_number ? maskPhone(user.phone_number) : undefined,
        expiresAt,
      });
      maskedDestination = user.phone_number ? maskPhone(user.phone_number) : undefined;
      logger.info('SMS OTP generated for MFA', { userId: user.id, otp: env.nodeEnv === 'development' ? otp : '[redacted]' });
    }

    return {
      challengeId: challengeUuid,
      nextStep,
      maskedDestination,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async verifyOtp(dto: VerifyOtpDto, ctx: RequestContext): Promise<LoginSuccessResponse> {
    const challenge = await this.challengeRepo.findByUuid(dto.challengeId);
    if (!challenge || challenge.status !== 'pending') {
      throw new NotFoundError('Invalid or expired verification challenge');
    }

    if (challenge.expires_at <= new Date()) {
      await this.challengeRepo.markExpired(challenge.id);
      throw new GoneError('Verification challenge has expired');
    }

    const user = await this.userRepo.findById(challenge.user_id);
    if (!user) throw new NotFoundError('User not found');

    let valid = false;

    if (challenge.challenge_type === CHALLENGE_TYPES.MFA_TOTP) {
      if (!user.totp_secret) throw new ValidationError('TOTP is not configured for this user');
      const totpResult = verifySync({ token: dto.otp, secret: user.totp_secret });
      valid = totpResult.valid;
    } else {
      const otpRecord = await this.otpRepo.findLatestByChallenge(challenge.id);
      if (!otpRecord) throw new NotFoundError('OTP not found');
      if (otpRecord.expires_at <= new Date()) throw new GoneError('OTP has expired');
      if (otpRecord.attempts >= otpRecord.max_attempts) {
        throw new TooManyRequestsError('Maximum OTP attempts exceeded');
      }

      valid = sha256(dto.otp) === otpRecord.otp_hash;
      if (!valid) {
        await this.otpRepo.incrementAttempts(otpRecord.id);
        await this.auditRepo.log({
          userId: user.id,
          eventType: AUTH_EVENT_TYPES.MFA_FAILED,
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
        });
        throw new UnauthorizedError('Invalid verification code');
      }
      await this.otpRepo.markVerified(otpRecord.id);
    }

    if (!valid) {
      await this.auditRepo.log({
        userId: user.id,
        eventType: AUTH_EVENT_TYPES.MFA_FAILED,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });
      throw new UnauthorizedError('Invalid verification code');
    }

    await this.challengeRepo.markVerified(challenge.id);
    await this.auditRepo.log({
      userId: user.id,
      eventType: AUTH_EVENT_TYPES.MFA_VERIFY,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { method: challenge.challenge_type },
    });

    const fingerprint =
      dto.deviceFingerprint ??
      (ctx.userAgent && ctx.ipAddress
        ? buildDeviceFingerprint(ctx.userAgent, ctx.ipAddress)
        : undefined);

    const rememberDevice = dto.trustDevice || challenge.remember_device === 1;
    return this.completeLogin(user, rememberDevice, ctx, fingerprint);
  }

  async resendOtp(dto: ResendOtpDto, ctx: RequestContext): Promise<{ message: string; resendAvailableAt: string }> {
    const challenge = await this.challengeRepo.findByUuid(dto.challengeId);
    if (!challenge || challenge.status !== 'pending') {
      throw new NotFoundError('Invalid or expired verification challenge');
    }

    const existingOtp = await this.otpRepo.findLatestByChallenge(challenge.id);
    if (existingOtp?.last_sent_at) {
      const cooldownMs = env.auth.otpResendCooldownSeconds * 1000;
      const elapsed = Date.now() - new Date(existingOtp.last_sent_at).getTime();
      if (elapsed < cooldownMs) {
        throw new TooManyRequestsError(
          `Please wait before requesting another code`,
        );
      }
    }

    const user = await this.userRepo.findById(challenge.user_id);
    if (!user) throw new NotFoundError('User not found');

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + env.auth.otpExpiryMinutes * 60 * 1000);

    await this.otpRepo.create({
      userId: user.id,
      challengeId: challenge.id,
      purpose: 'mfa_sms',
      otpHash: sha256(otp),
      channel: 'sms',
      destinationMasked: user.phone_number ? maskPhone(user.phone_number) : undefined,
      expiresAt,
    });

    await this.auditRepo.log({
      userId: user.id,
      eventType: AUTH_EVENT_TYPES.OTP_RESENT,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    logger.info('OTP resent', { userId: user.id, otp: env.nodeEnv === 'development' ? otp : '[redacted]' });

    const resendAvailableAt = new Date(Date.now() + env.auth.otpResendCooldownSeconds * 1000).toISOString();
    return { message: 'Verification code resent', resendAvailableAt };
  }

  private async completeLogin(
    user: UserRecord,
    rememberDevice: boolean,
    ctx: RequestContext,
    fingerprint?: string,
  ): Promise<LoginSuccessResponse> {
    const parsed = parseUserAgent(ctx.userAgent ?? '');
    const sessionUuid = randomUUID();
    const sessionExpiresAt = this.tokenService.getSessionExpiry(rememberDevice);

    let trustedDeviceId: number | null = null;
    let trustedUntil: Date | null = null;

    if (rememberDevice && fingerprint) {
      trustedUntil = new Date(Date.now() + env.auth.trustDeviceDays * 24 * 60 * 60 * 1000);
      trustedDeviceId = await this.trustedDeviceRepo.upsert({
        userId: user.id,
        fingerprint,
        deviceLabel: parsed.deviceName,
        trustedUntil,
      });
    }

    const sessionId = await this.sessionRepo.create({
      uuid: sessionUuid,
      userId: user.id,
      trustedDeviceId,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      deviceName: parsed.deviceName,
      browser: parsed.browser,
      os: parsed.os,
      expiresAt: sessionExpiresAt,
      trustedUntil,
    });

    const refreshTokenValue = this.tokenService.generateRefreshTokenValue();
    const refreshExpiresAt = this.tokenService.getRefreshTokenExpiry(rememberDevice);
    const refreshTokenId = await this.refreshTokenRepo.create({
      userId: user.id,
      sessionId,
      tokenHash: this.tokenService.hashRefreshToken(refreshTokenValue),
      expiresAt: refreshExpiresAt,
    });

    const orgContext = await this.resolveOrgForUser(user.id);
    const basePayload = this.buildAuthPayload(user, sessionId, sessionUuid, orgContext);
    const payload = await enrichAuthPayload(basePayload, orgContext?.organizationId);

    const tokens = this.tokenService.buildTokenPair(payload, refreshTokenValue, refreshExpiresAt);

    await this.userRepo.updateLoginSuccess(user.id);
    await this.loginAttemptRepo.create({
      userId: user.id,
      email: user.email,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      success: true,
    });
    await this.auditRepo.log({
      userId: user.id,
      sessionId,
      eventType: AUTH_EVENT_TYPES.LOGIN,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { refreshTokenId },
    });
    await this.auditRepo.log({
      userId: user.id,
      sessionId,
      eventType: AUTH_EVENT_TYPES.SESSION_CREATED,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    void notificationDispatch.welcome(user.id).catch(() => {});
    void auditRecorder.login({
      userId: user.id,
      actorName: `${user.first_name} ${user.last_name}`,
      sessionId,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    }).catch(() => {});

    return this.withOrganizations(user.id, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.accessTokenExpiresIn,
      user: {
        id: user.id,
        uuid: user.uuid,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        mfaEnabled: user.mfa_enabled === 1,
      },
    }, Boolean(orgContext));
  }

  async forgotPassword(dto: ForgotPasswordDto, ctx: RequestContext): Promise<{ message: string }> {
    const user = await this.userRepo.findByEmail(dto.email.toLowerCase());

    if (user) {
      const rawToken = this.tokenService.generateRefreshTokenValue();
      await this.passwordResetRepo.create({
        userId: user.id,
        tokenHash: sha256(rawToken),
        expiresInMinutes: env.auth.resetTokenExpiryMinutes,
        requestedIp: ctx.ipAddress,
      });
      await this.auditRepo.log({
        userId: user.id,
        eventType: AUTH_EVENT_TYPES.PASSWORD_RESET_REQUESTED,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { email: user.email },
      });

      const resetUrl = buildPasswordResetUrl(env.corsOrigin, rawToken);
      const jobId = await backgroundJobService.enqueue('password_reset_email', {
        recipient: user.email,
        resetUrl,
        userId: user.id,
        correlationId: ctx.ipAddress ?? undefined,
      });
      if (process.env.NODE_ENV === 'test') {
        await backgroundJobService.markCompleted(jobId);
      }

      logger.info('Password reset email queued', { userId: user.id });
    }

    return {
      message: 'If an account exists with that email, a password reset link has been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto, ctx: RequestContext): Promise<{ message: string }> {
    this.passwordService.validatePolicy(dto.newPassword);
    const rawToken = dto.token.trim();
    const tokenHash = sha256(rawToken);
    const resetToken = await this.passwordResetRepo.findValidByHash(tokenHash);
    if (!resetToken) throw new GoneError('Reset token is invalid or has expired');

    const user = await this.userRepo.findById(resetToken.user_id);
    if (!user) throw new NotFoundError('User not found');

    const newHash = await this.passwordService.hash(dto.newPassword);
    await this.passwordService.ensureNotReused(user.id, newHash);

    if (user.password_hash) {
      await this.passwordHistoryRepo.add(user.id, user.password_hash);
    }

    await this.userRepo.updatePassword(user.id, newHash);
    await this.passwordResetRepo.markUsed(resetToken.id);
    await this.sessionRepo.revokeAllForUser(user.id);
    await this.refreshTokenRepo.revokeAllForUser(user.id);

    await this.auditRepo.log({
      userId: user.id,
      eventType: AUTH_EVENT_TYPES.PASSWORD_RESET_COMPLETED,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return { message: 'Password has been reset successfully' };
  }

  async refreshToken(refreshToken: string, ctx: RequestContext, organizationId?: number): Promise<LoginSuccessResponse> {
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const stored = await this.refreshTokenRepo.findByHash(tokenHash);

    if (!stored || stored.revoked_at || stored.expires_at <= new Date()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    if (stored.replaced_by_token_id) {
      await this.refreshTokenRepo.revokeAllForUser(stored.user_id);
      await this.sessionRepo.revokeAllForUser(stored.user_id);
      await this.auditRepo.log({
        userId: stored.user_id,
        sessionId: stored.session_id,
        eventType: AUTH_EVENT_TYPES.TOKEN_REUSE_DETECTED,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });
      throw new UnauthorizedError('Refresh token reuse detected. All sessions have been revoked.');
    }

    const session = await this.sessionRepo.findById(stored.session_id);
    if (!session || session.status !== 'active' || session.expires_at <= new Date()) {
      throw new UnauthorizedError('Session is no longer active');
    }

    const user = await this.userRepo.findById(stored.user_id);
    if (!user || user.status !== USER_STATUS.ACTIVE) {
      throw new UnauthorizedError('User account is not active');
    }

    const newRefreshValue = this.tokenService.generateRefreshTokenValue();
    const refreshExpiresAt = this.tokenService.getRefreshTokenExpiry();
    const newRefreshId = await this.refreshTokenRepo.create({
      userId: user.id,
      sessionId: session.id,
      tokenHash: this.tokenService.hashRefreshToken(newRefreshValue),
      expiresAt: refreshExpiresAt,
    });

    await this.refreshTokenRepo.markReplaced(stored.id, newRefreshId);
    await this.sessionRepo.updateActivity(session.id);

    const orgContext = await this.resolveOrgForUser(user.id, organizationId);
    const basePayload = this.buildAuthPayload(user, session.id, session.uuid, orgContext);
    const payload = await enrichAuthPayload(basePayload, orgContext?.organizationId);

    const tokens = this.tokenService.buildTokenPair(payload, newRefreshValue, refreshExpiresAt);

    await this.auditRepo.log({
      userId: user.id,
      sessionId: session.id,
      eventType: AUTH_EVENT_TYPES.TOKEN_REFRESHED,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return this.withOrganizations(user.id, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.accessTokenExpiresIn,
      user: {
        id: user.id,
        uuid: user.uuid,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        mfaEnabled: user.mfa_enabled === 1,
      },
    }, Boolean(orgContext));
  }

  async selectOrganization(
    userId: number,
    sessionId: number,
    organizationId: number,
  ): Promise<{ accessToken: string; expiresIn: string; organizationId: number; organizationRoleCode: string }> {
    const user = await this.userRepo.findById(userId);
    if (!user || user.status !== USER_STATUS.ACTIVE) {
      throw new UnauthorizedError('User account is not active');
    }
    const session = await this.sessionRepo.findById(sessionId);
    if (!session || session.status !== 'active' || session.user_id !== userId) {
      throw new UnauthorizedError('Session is no longer active');
    }
    const orgContext = await this.resolveOrgForUser(userId, organizationId);
    if (!orgContext) {
      throw new ValidationError('Organization selection is required');
    }
    const payload = await enrichAuthPayload(
      this.buildAuthPayload(user, session.id, session.uuid, orgContext),
      orgContext.organizationId,
    );
    const accessToken = this.tokenService.generateAccessToken(payload);
    return {
      accessToken,
      expiresIn: env.jwt.expiresIn,
      organizationId: orgContext.organizationId,
      organizationRoleCode: orgContext.organizationRoleCode,
    };
  }

  async logout(sessionId: number, userId: number, ctx: RequestContext): Promise<void> {
    await this.sessionRepo.revoke(sessionId);
    await this.refreshTokenRepo.revokeBySession(sessionId);
    await this.auditRepo.log({
      userId,
      sessionId,
      eventType: AUTH_EVENT_TYPES.LOGOUT,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
    void auditRecorder.logout({ userId, sessionId, ipAddress: ctx.ipAddress, userAgent: ctx.userAgent }).catch(() => {});
  }

  async getMe(userId: number) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    const [roles, permissions] = await Promise.all([
      this.permissionRepo.getRolesForUser(userId),
      this.permissionRepo.getPermissionCodesForUser(userId),
    ]);
    return {
      uuid: user.uuid,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phoneNumber: user.phone_number,
      mfaEnabled: user.mfa_enabled === 1,
      mfaMethod: user.mfa_method,
      status: user.status,
      emailVerified: !!user.email_verified_at,
      phoneVerified: !!user.phone_verified_at,
      lastLoginAt: user.last_login_at,
      passwordChangedAt: user.password_changed_at,
      roles: roles.map((r) => ({ id: r.id, uuid: r.uuid, code: r.code, name: r.name })),
      permissions: permissions.includes('*') ? ['*'] : permissions,
    };
  }

  async getSessions(userId: number, currentSessionId: number) {
    const sessions = await this.sessionRepo.findActiveByUserId(userId);
    return sessions.map((s) => ({
      id: s.uuid,
      deviceName: s.device_name,
      browser: s.browser,
      os: s.os,
      ipAddress: s.ip_address,
      location: [s.location_city, s.location_country].filter(Boolean).join(', ') || null,
      status: s.status,
      isCurrent: s.id === currentSessionId,
      lastActiveAt: s.last_activity_at,
      createdAt: s.created_at,
    }));
  }

  async revokeSession(userId: number, currentSessionId: number, sessionUuid: string, ctx: RequestContext) {
    const session = await this.sessionRepo.findByUuid(sessionUuid);
    if (!session || session.user_id !== userId) {
      throw new NotFoundError('Session not found');
    }
    if (session.id === currentSessionId) {
      throw new ForbiddenError('Cannot revoke the current session');
    }
    await this.sessionRepo.revoke(session.id);
    await this.refreshTokenRepo.revokeBySession(session.id);
    await this.auditRepo.log({
      userId,
      sessionId: session.id,
      eventType: AUTH_EVENT_TYPES.SESSION_REVOKED,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
  }

  async revokeOtherSessions(userId: number, currentSessionId: number, ctx: RequestContext) {
    const revokedCount = await this.sessionRepo.revokeAllExcept(userId, currentSessionId);
    await this.refreshTokenRepo.revokeAllForUserExceptSession(userId, currentSessionId);
    await this.auditRepo.log({
      userId,
      sessionId: currentSessionId,
      eventType: AUTH_EVENT_TYPES.SESSIONS_REVOKED_OTHERS,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { revokedCount },
    });
    return { revokedCount, message: 'All other sessions have been revoked' };
  }

  async changePassword(userId: number, dto: ChangePasswordDto, ctx: RequestContext): Promise<{ message: string }> {
    const user = await this.userRepo.findById(userId);
    if (!user || !user.password_hash) {
      throw new UnauthorizedError('Unable to change password');
    }

    const valid = await this.passwordService.compare(dto.currentPassword, user.password_hash);
    if (!valid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    await this.passwordService.validatePolicyAsync(dto.newPassword);
    const newHash = await this.passwordService.hash(dto.newPassword);
    await this.passwordService.ensureNotReused(user.id, newHash);

    await this.passwordHistoryRepo.add(user.id, user.password_hash);
    await this.userRepo.updatePassword(user.id, newHash);

    await this.auditRepo.log({
      userId,
      eventType: AUTH_EVENT_TYPES.PASSWORD_RESET_COMPLETED,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { source: 'change_password' },
    });

    void notificationDispatch.passwordChanged(userId).catch(() => {});
    void auditRecorder.passwordChange({ userId, ipAddress: ctx.ipAddress, userAgent: ctx.userAgent }).catch(() => {});

    return { message: 'Password changed successfully' };
  }

  async updateMfaPreferences(userId: number, dto: MfaPreferencesDto, ctx: RequestContext) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const security = await this.settingsRepo.getSecurity();
    if (security?.mfaEnforced && !dto.mfaEnabled) {
      throw new ForbiddenError('MFA is enforced by organization policy');
    }

    await this.userRepo.updateMfaPreferences(userId, dto.mfaEnabled, dto.mfaMethod);
    await this.auditRepo.log({
      userId,
      eventType: AUTH_EVENT_TYPES.MFA_VERIFY,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { mfaEnabled: dto.mfaEnabled, mfaMethod: dto.mfaMethod },
    });

    if (dto.mfaEnabled) {
      void notificationDispatch.mfaEnabled(userId).catch(() => {});
      void auditRecorder.mfaEnabled({ userId, ipAddress: ctx.ipAddress, userAgent: ctx.userAgent }).catch(() => {});
    } else {
      void auditRecorder.mfaDisabled({ userId, ipAddress: ctx.ipAddress, userAgent: ctx.userAgent }).catch(() => {});
    }

    return {
      mfaEnabled: dto.mfaEnabled,
      mfaMethod: dto.mfaMethod ?? user.mfa_method,
    };
  }

  async getSessionSettings() {
    const settings = await this.settingsRepo.getSessionSettings();
    return settings ?? {
      idleTimeoutMinutes: env.auth.sessionIdleMinutes,
      maxSessionDurationMinutes: 480,
      maxConcurrentSessions: 5,
      rememberDeviceDays: env.auth.trustDeviceDays,
    };
  }
}
