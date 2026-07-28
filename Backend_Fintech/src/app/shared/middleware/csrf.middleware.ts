import { randomBytes } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { env } from '../../config';

export const CSRF_COOKIE_NAME = 'csrfToken';
export const CSRF_HEADER_NAME = 'x-csrf-token';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const CSRF_SKIP_PREFIXES = [
  '/api/live',
  '/api/ready',
  '/api/health',
  '/api/docs',
  '/api/swagger',
];

function usesBearerAuth(req: Request): boolean {
  const authHeader = req.headers.authorization;
  return typeof authHeader === 'string' && authHeader.startsWith('Bearer ');
}

export function issueCsrfToken(_req: Request, res: Response): void {
  const token = randomBytes(32).toString('hex');
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: env.nodeEnv === 'production',
    sameSite: 'strict',
    path: '/api',
    maxAge: 24 * 60 * 60 * 1000,
  });
  res.status(200).json({ success: true, data: { csrfToken: token } });
}

export function csrfProtectionMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (SAFE_METHODS.has(req.method)) {
      next();
      return;
    }

    if (CSRF_SKIP_PREFIXES.some((prefix) => req.path.startsWith(prefix))) {
      next();
      return;
    }

    if (usesBearerAuth(req)) {
      next();
      return;
    }

    const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
    const headerToken = req.headers[CSRF_HEADER_NAME];

    if (
      typeof cookieToken !== 'string' ||
      typeof headerToken !== 'string' ||
      cookieToken.length === 0 ||
      headerToken.length === 0 ||
      cookieToken !== headerToken
    ) {
      res.status(403).json({
        success: false,
        message: 'Invalid or missing CSRF token',
        code: 'CSRF_INVALID',
      });
      return;
    }

    next();
  };
}
