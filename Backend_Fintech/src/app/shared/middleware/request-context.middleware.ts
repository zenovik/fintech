import { randomUUID } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { patchRequestContext, requestContextStorage } from '../context/request-context';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

const REQUEST_ID_HEADER = 'x-request-id';

export function requestContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers[REQUEST_ID_HEADER];
  const requestId = (Array.isArray(incoming) ? incoming[0] : incoming)?.trim() || randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  requestContextStorage.run({ requestId, route: req.originalUrl }, () => {
    next();
  });
}

export function syncAuthenticatedRequestContext(req: Request, _res: Response, next: NextFunction): void {
  patchRequestContext({
    userId: req.user?.sub,
    organizationId: req.user?.organizationId ?? req.organizationId,
    route: req.originalUrl,
  });
  next();
}
