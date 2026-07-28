import { Response } from 'express';
import { env } from '../../../config';

export function parseTokenExpiryMs(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * (multipliers[match[2]] ?? multipliers.m);
}

export function getAccessTokenCookieOptions(expiresIn = env.jwt.expiresIn) {
  return {
    httpOnly: true as const,
    secure: env.nodeEnv === 'production',
    sameSite: 'strict' as const,
    maxAge: parseTokenExpiryMs(expiresIn),
    path: '/api',
  };
}

export function getRefreshTokenCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true as const,
    secure: env.nodeEnv === 'production',
    sameSite: 'strict' as const,
    expires: expiresAt,
    path: '/api/auth',
  };
}

export function setAccessTokenCookie(res: Response, accessToken: string, expiresIn?: string): void {
  res.cookie(env.auth.accessTokenCookieName, accessToken, getAccessTokenCookieOptions(expiresIn));
}

export function clearAccessTokenCookie(res: Response): void {
  res.clearCookie(env.auth.accessTokenCookieName, { path: '/api' });
}

export function setRefreshCookie(res: Response, refreshToken: string, expiresAt: Date): void {
  res.cookie(env.auth.refreshTokenCookieName, refreshToken, getRefreshTokenCookieOptions(expiresAt));
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(env.auth.refreshTokenCookieName, { path: '/api/auth' });
}

export function clearAuthCookies(res: Response): void {
  clearAccessTokenCookie(res);
  clearRefreshCookie(res);
}
