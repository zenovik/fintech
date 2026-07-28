import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../exceptions/app.exception';
import { logger } from '../logger';
import { getRequestId } from '../context/request-context';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const requestId = req.requestId ?? getRequestId();

  if (err instanceof AppError) {
    if (requestId) res.setHeader('X-Request-Id', requestId);
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      errors: err.details,
      requestId,
    });
    return;
  }

  if (err instanceof ZodError) {
    if (requestId) res.setHeader('X-Request-Id', requestId);
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: err.flatten().fieldErrors,
      requestId,
    });
    return;
  }

  const mysqlErr = err as Error & { code?: string; sqlMessage?: string };
  if (mysqlErr.code === 'ER_DUP_ENTRY') {
    if (requestId) res.setHeader('X-Request-Id', requestId);
    res.status(409).json({
      success: false,
      message: 'Duplicate resource',
      code: 'DUPLICATE',
      requestId,
    });
    return;
  }

  if (mysqlErr.code?.startsWith('ER_')) {
    logger.error('Database error', {
      requestId,
      route: req.originalUrl,
      userId: req.user?.sub,
      organizationId: req.user?.organizationId ?? req.organizationId,
      code: mysqlErr.code,
      status: 500,
    });
    if (requestId) res.setHeader('X-Request-Id', requestId);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      requestId,
    });
    return;
  }

  logger.error('Unhandled error', {
    requestId,
    route: req.originalUrl,
    userId: req.user?.sub,
    organizationId: req.user?.organizationId ?? req.organizationId,
    message: err.message,
    status: 500,
  });
  if (requestId) res.setHeader('X-Request-Id', requestId);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
    requestId,
  });
}
