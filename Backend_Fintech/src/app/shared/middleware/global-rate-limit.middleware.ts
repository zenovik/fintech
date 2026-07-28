import rateLimit from 'express-rate-limit';
import { env } from '../../config';

const HEALTH_PATHS = new Set(['/api/health', '/api/live', '/api/ready']);

export function buildGlobalRateLimitMiddleware() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.nodeEnv === 'production' ? 2000 : 5000,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => HEALTH_PATHS.has(req.path),
    message: {
      success: false,
      message: 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  });
}

export function buildApiRateLimitMiddleware(maxPerMinute = 300) {
  return rateLimit({
    windowMs: 60 * 1000,
    max: maxPerMinute,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'API rate limit exceeded.',
      code: 'API_RATE_LIMIT_EXCEEDED',
    },
  });
}
