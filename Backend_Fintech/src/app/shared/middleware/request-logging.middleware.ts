import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';
import { patchRequestContext } from '../context/request-context';
import { isSensitiveRoute } from '../helpers/pii-mask.helper';

export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startedAt = Date.now();
  patchRequestContext({ route: req.originalUrl });

  res.on('finish', () => {
    const duration = Date.now() - startedAt;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    const payload: Record<string, unknown> = {
      requestId: req.requestId,
      route: req.originalUrl,
      method: req.method,
      status: res.statusCode,
      duration,
    };
    if (!isSensitiveRoute(req.originalUrl)) {
      payload.userId = req.user?.sub;
      payload.organizationId = req.user?.organizationId ?? req.organizationId;
    }
    logger[level]('HTTP request completed', payload);
  });

  next();
}
