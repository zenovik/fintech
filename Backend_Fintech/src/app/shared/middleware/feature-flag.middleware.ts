import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../exceptions/app.exception';

let cache: { routes: import('mysql2/promise').RowDataPacket[]; loadedAt: number } | null = null;
const CACHE_TTL_MS = 60_000;

export async function isRouteBlockedByFeatureFlag(method: string, path: string): Promise<boolean> {
  const { getPool } = await import('../../database');
  const pool = getPool();
  const now = Date.now();
  if (!cache || now - cache.loadedAt > CACHE_TTL_MS) {
    const [rows] = await pool.query<import('mysql2/promise').RowDataPacket[]>(
      `SELECT ff.code, ff.is_enabled, ar.route_pattern, ar.http_method
       FROM feature_flag_api_routes ar
       JOIN feature_flags ff ON ff.id = ar.feature_flag_id`,
    );
    cache = { routes: rows, loadedAt: now };
  }
  for (const r of cache.routes) {
    if (!r.is_enabled && (r.http_method === '*' || r.http_method === method.toUpperCase())) {
      const pattern = String(r.route_pattern).replace(/\*/g, '.*');
      if (new RegExp(`^${pattern}$`).test(path)) return true;
    }
  }
  return false;
}

export async function featureFlagGuard(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const blocked = await isRouteBlockedByFeatureFlag(req.method, req.path);
    if (blocked) throw new ForbiddenError('This feature is currently disabled');
    next();
  } catch (err) {
    next(err);
  }
}
