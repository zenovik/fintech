import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/token.service';
import { SessionRepository } from '../repositories/session.repository';
import { UnauthorizedError } from '../../../shared/exceptions/app.exception';
import { env } from '../../../config';
import { AuthUserPayload } from '../types/auth.types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

const tokenService = new TokenService();
const sessionRepo = new SessionRepository();

function extractAccessToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice(7);
  }
  const cookieToken = req.cookies?.[env.auth.accessTokenCookieName];
  return typeof cookieToken === 'string' && cookieToken.length > 0 ? cookieToken : null;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractAccessToken(req);
    if (!token) {
      throw new UnauthorizedError('Access token is required');
    }

    const payload = tokenService.verifyAccessToken(token);

    const session = await sessionRepo.findById(payload.sessionId);
    if (!session || session.status !== 'active' || session.expires_at <= new Date()) {
      throw new UnauthorizedError('Session has expired');
    }

    const idleLimitMs = env.auth.sessionIdleMinutes * 60 * 1000;
    const idleDuration = Date.now() - new Date(session.last_activity_at).getTime();
    if (idleDuration > idleLimitMs) {
      await sessionRepo.revoke(session.id);
      throw new UnauthorizedError('Session expired due to inactivity');
    }

    await sessionRepo.updateActivity(session.id);
    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
}
