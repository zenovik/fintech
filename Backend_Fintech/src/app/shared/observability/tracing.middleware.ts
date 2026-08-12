import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { recordMetric } from './metrics.registry';

const activeSpans = new Map<string, { name: string; start: number }>();

export function tracingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const traceId = String(req.headers['x-trace-id'] ?? req.headers['traceparent'] ?? randomUUID());
  const spanId = randomUUID().slice(0, 16);
  const start = Date.now();
  activeSpans.set(spanId, { name: `${req.method} ${req.path}`, start });

  res.setHeader('X-Trace-Id', traceId);
  res.setHeader('X-Span-Id', spanId);

  res.on('finish', () => {
    activeSpans.delete(spanId);
    recordMetric(`http.${req.method.toLowerCase()}`, res.statusCode < 500, Date.now() - start, String(res.statusCode));
  });

  next();
}

export function getActiveSpanCount(): number {
  return activeSpans.size;
}
