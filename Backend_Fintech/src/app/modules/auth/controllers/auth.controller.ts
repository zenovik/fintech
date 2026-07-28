import { Request, Response } from 'express';
import { env } from '../../../config';
import { AuthService } from '../services/auth.service';
import { sendSuccess, sendMessage } from '../../../shared/responses/api.response';
import {
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyOtpDto,
  ResendOtpDto,
} from '../dto';
import { MfaChallengeResponse, LoginSuccessResponse } from '../types/auth.types';
import {
  clearAuthCookies,
  setAccessTokenCookie,
  setRefreshCookie,
} from '../helpers/auth-cookie.helper';

function getContext(req: Request) {
  return {
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  };
}

function serializeLoginPayload(result: LoginSuccessResponse) {
  return {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    expiresIn: result.expiresIn,
    user: result.user,
    organizations: result.organizations,
    requiresOrganizationSelection: result.requiresOrganizationSelection,
  };
}

function applyAuthCookies(res: Response, result: LoginSuccessResponse): void {
  setAccessTokenCookie(res, result.accessToken, result.expiresIn);
  setRefreshCookie(res, result.refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
}

export class AuthController {
  constructor(private readonly authService = new AuthService()) {}

  login = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.login(req.body as LoginDto, getContext(req));

    if ('challengeId' in result) {
      sendSuccess<MfaChallengeResponse>(res, result, 202, 'MFA verification required');
      return;
    }

    const loginResult = result as LoginSuccessResponse;
    applyAuthCookies(res, loginResult);
    sendSuccess(res, serializeLoginPayload(loginResult));
  };

  verifyOtp = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.verifyOtp(req.body as VerifyOtpDto, getContext(req));
    applyAuthCookies(res, result);
    sendSuccess(res, serializeLoginPayload(result));
  };

  resendOtp = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.resendOtp(req.body as ResendOtpDto, getContext(req));
    sendSuccess(res, result);
  };

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.forgotPassword(req.body as ForgotPasswordDto, getContext(req));
    sendMessage(res, result.message);
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.resetPassword(req.body as ResetPasswordDto, getContext(req));
    sendMessage(res, result.message);
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    const refreshToken =
      req.body?.refreshToken ?? req.cookies?.[env.auth.refreshTokenCookieName];
    const headerOrg = req.headers['x-organization-id'];
    const organizationId = req.body?.organizationId ?? (Array.isArray(headerOrg) ? headerOrg[0] : headerOrg);
    const result = await this.authService.refreshToken(
      refreshToken,
      getContext(req),
      organizationId ? Number(organizationId) : undefined,
    );
    applyAuthCookies(res, result);
    sendSuccess(res, serializeLoginPayload(result));
  };

  selectOrganization = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.selectOrganization(
      req.user!.sub,
      req.user!.sessionId,
      Number(req.body.organizationId),
    );
    sendSuccess(res, result);
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    await this.authService.logout(req.user!.sessionId, req.user!.sub, getContext(req));
    clearAuthCookies(res);
    sendMessage(res, 'Logged out successfully', 200);
  };

  me = async (req: Request, res: Response): Promise<void> => {
    const user = await this.authService.getMe(req.user!.sub);
    sendSuccess(res, user);
  };

  getSessions = async (req: Request, res: Response): Promise<void> => {
    const sessions = await this.authService.getSessions(req.user!.sub, req.user!.sessionId);
    sendSuccess(res, sessions);
  };

  revokeSession = async (req: Request, res: Response): Promise<void> => {
    await this.authService.revokeSession(
      req.user!.sub,
      req.user!.sessionId,
      req.params.id,
      getContext(req),
    );
    sendMessage(res, 'Session revoked successfully');
  };

  revokeOtherSessions = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.revokeOtherSessions(
      req.user!.sub,
      req.user!.sessionId,
      getContext(req),
    );
    sendSuccess(res, result);
  };

  changePassword = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.changePassword(req.user!.sub, req.body, getContext(req));
    sendMessage(res, result.message);
  };

  updateMfaPreferences = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.authService.updateMfaPreferences(req.user!.sub, req.body, getContext(req)));
  };

  getSessionSettings = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.authService.getSessionSettings());
  };
}
