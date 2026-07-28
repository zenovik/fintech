import { Pool, RowDataPacket } from 'mysql2/promise';
import { getPool } from '../../database';
import { cacheGet, cacheSet } from '../infrastructure/redis.client';
import { logger } from '../logger';

const MONEY_CACHE_PREFIXES = ['payment:', 'transaction:', 'checkout:', 'settlement:', 'refund:'];

export class CacheService {
  constructor(private readonly pool: Pool = getPool()) {}

  private isMoneyKey(key: string): boolean {
    return MONEY_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix));
  }

  async getConfiguredTtl(cacheKey: string, fallbackSeconds: number): Promise<number> {
    try {
      const [rows] = await this.pool.query<RowDataPacket[]>(
        `SELECT ttl_seconds, is_enabled FROM cache_configurations WHERE cache_key = ? LIMIT 1`,
        [cacheKey],
      );
      const row = rows[0];
      if (!row || !row.is_enabled) return 0;
      return Number(row.ttl_seconds ?? fallbackSeconds);
    } catch {
      return fallbackSeconds;
    }
  }

  async getOrSet<T>(
    key: string,
    loader: () => Promise<T>,
    options: { cacheKey?: string; fallbackTtlSeconds?: number; skipMoney?: boolean } = {},
  ): Promise<T> {
    if (options.skipMoney !== false && this.isMoneyKey(key)) {
      return loader();
    }

    const ttl = await this.getConfiguredTtl(options.cacheKey ?? key, options.fallbackTtlSeconds ?? 60);
    if (ttl <= 0) return loader();

    const cached = await cacheGet<T>(key);
    if (cached != null) return cached;

    const value = await loader();
    try {
      await cacheSet(key, value, ttl);
    } catch (err) {
      logger.debug('Cache set failed', { key, message: err instanceof Error ? err.message : String(err) });
    }
    return value;
  }

  async invalidate(key: string): Promise<void> {
    try {
      await cacheSet(key, null, 1);
    } catch { /* best effort */ }
  }
}

export const cacheService = new CacheService();
