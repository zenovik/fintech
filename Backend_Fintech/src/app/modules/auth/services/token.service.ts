import jwt from 'jsonwebtoken';
import { env } from '../../../config';
import { sha256, generateSecureToken } from '../../../shared/helpers/crypto.helper';
import { AuthUserPayload, TokenPair } from '../types/auth.types';
import { UnauthorizedError } from '../../../shared/exceptions/app.exception';

export class TokenService {
  generateAccessToken(payload: AuthUserPayload): string {
    return jwt.sign(payload, env.jwt.secret, {
      expiresIn: env.jwt.expiresIn as jwt.SignOptions['expiresIn'],
      algorithm: 'HS256',
    });
  }

  verifyAccessToken(token: string): AuthUserPayload {
    try {
      const decoded = jwt.verify(token, env.jwt.secret, { algorithms: ['HS256'] });
      return decoded as unknown as AuthUserPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired access token');
    }
  }

  generateRefreshTokenValue(): string {
    return generateSecureToken(48);
  }

  hashRefreshToken(token: string): string {
    return sha256(token);
  }

  getRefreshTokenExpiry(rememberDevice = false): Date {
    const expiresIn = rememberDevice ? '30d' : env.jwt.refreshExpiresIn;
    return this.parseExpiryToDate(expiresIn);
  }

  getSessionExpiry(rememberDevice = false): Date {
    return this.getRefreshTokenExpiry(rememberDevice);
  }

  buildTokenPair(
    payload: AuthUserPayload,
    refreshToken: string,
    refreshExpiresAt: Date,
  ): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken,
      accessTokenExpiresIn: env.jwt.expiresIn,
      refreshTokenExpiresAt: refreshExpiresAt,
    };
  }

  private parseExpiryToDate(expiry: string): Date {
    const now = Date.now();
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return new Date(now + 7 * 24 * 60 * 60 * 1000);
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return new Date(now + value * (multipliers[unit] ?? multipliers.d));
  }
}
