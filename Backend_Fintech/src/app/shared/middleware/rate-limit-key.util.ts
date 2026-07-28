import type { Request } from 'express';
import { ipKeyGenerator } from 'express-rate-limit';

/**
 * Builds a rate-limit key from authenticated user id, falling back to client IP.
 * Uses ipKeyGenerator for IPv6-safe subnet keys (express-rate-limit v8 requirement).
 */
export function rateLimitKeyFromUserOrIp(req: Request, userId?: string | number | null): string {
  if (userId != null && userId !== '') {
    return String(userId);
  }
  if (req.ip) {
    return ipKeyGenerator(req.ip);
  }
  return 'anonymous';
}
