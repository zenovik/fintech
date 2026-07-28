import Redis from 'ioredis';
import { env } from '../../config';
import { logger } from '../logger';


export interface RedisLike {

  get(key: string): Promise<string | null>;

  set(key: string, value: string): Promise<string | null>;

  setex(key: string, seconds: number, value: string): Promise<string | null>;

  del(key: string): Promise<number>;

  incr(key: string): Promise<number>;

  expire(key: string, seconds: number): Promise<number>;

  ping(): Promise<string>;

  quit(): Promise<string>;

  disconnect(): void;

  set(key: string, value: string, mode: 'EX', ttl: number, flag: 'NX'): Promise<string | null>;

}



class InMemoryRedis implements RedisLike {

  private store = new Map<string, { value: string; expiresAt?: number }>();



  private purgeExpired(key: string): void {

    const entry = this.store.get(key);

    if (entry?.expiresAt && entry.expiresAt <= Date.now()) {

      this.store.delete(key);

    }

  }



  async get(key: string): Promise<string | null> {

    this.purgeExpired(key);

    return this.store.get(key)?.value ?? null;

  }



  async set(key: string, value: string, mode?: 'EX', ttl?: number, flag?: 'NX'): Promise<string | null> {

    if (mode === 'EX' && flag === 'NX') {

      this.purgeExpired(key);

      if (this.store.has(key)) return null;

      this.store.set(key, { value, expiresAt: Date.now() + (ttl ?? 0) * 1000 });

      return 'OK';

    }

    this.store.set(key, { value });

    return 'OK';

  }



  async setex(key: string, seconds: number, value: string): Promise<string | null> {

    this.store.set(key, { value, expiresAt: Date.now() + seconds * 1000 });

    return 'OK';

  }



  async del(key: string): Promise<number> {

    return this.store.delete(key) ? 1 : 0;

  }



  async incr(key: string): Promise<number> {

    const current = Number((await this.get(key)) ?? 0) + 1;

    await this.set(key, String(current));

    return current;

  }



  async expire(key: string, seconds: number): Promise<number> {

    const entry = this.store.get(key);

    if (!entry) return 0;

    entry.expiresAt = Date.now() + seconds * 1000;

    return 1;

  }



  async ping(): Promise<string> {

    return 'PONG';

  }



  async quit(): Promise<string> {

    this.store.clear();

    return 'OK';

  }



  disconnect(): void {

    this.store.clear();

  }

}



let client: RedisLike | null = null;

let realRedis: Redis | null = null;

let usingFallback = false;

let initAttempted = false;

let recoveryTimer: NodeJS.Timeout | null = null;



function activateFallback(reason: string): void {

  if (usingFallback && client instanceof InMemoryRedis) return;

  logger.warn('Redis degraded — using in-memory fallback', { reason });

  usingFallback = true;

  client = new InMemoryRedis();

  if (realRedis) {

    realRedis.disconnect();

    realRedis = null;

  }

}



async function connectRealRedis(): Promise<boolean> {

  if (!env.redis.enabled || !env.redis.url) return false;

  try {

    const redis = new Redis(env.redis.url, {

      maxRetriesPerRequest: 2,

      enableReadyCheck: true,

      lazyConnect: true,

      connectTimeout: 5000,

    });

    redis.on('error', (err) => {

      logger.warn('Redis connection error', { message: err.message });

      if (!usingFallback) activateFallback(err.message);

    });

    await redis.connect();

    const pong = await redis.ping();

    if (pong !== 'PONG') throw new Error('Redis ping failed');



    if (realRedis) {

      await realRedis.quit().catch(() => realRedis?.disconnect());

    }

    realRedis = redis;

    client = redis as unknown as RedisLike;

    usingFallback = false;

    logger.info('Redis connection active');

    return true;

  } catch (err) {

    const message = err instanceof Error ? err.message : String(err);

    logger.warn('Redis connect failed', { message });

    return false;

  }

}



export function isRedisFallback(): boolean {

  return usingFallback;

}



export function getRedisClient(): RedisLike {

  if (client) return client;

  initAttempted = true;



  if (env.redis.enabled && env.redis.url) {

    client = new InMemoryRedis();

    usingFallback = true;

    void connectRealRedis().then((connected) => {

      if (!connected) activateFallback('initial connect failed');

    });

    return client;

  }



  client = new InMemoryRedis();

  usingFallback = true;

  return client;

}



export async function attemptRedisRecovery(): Promise<boolean> {

  if (!env.redis.enabled || !env.redis.url) return false;

  if (!usingFallback) return true;

  return connectRealRedis();

}



export function startRedisRecoveryLoop(intervalMs = 60_000): void {

  if (recoveryTimer || !env.redis.enabled) return;

  recoveryTimer = setInterval(() => {

    if (usingFallback) {

      void attemptRedisRecovery();

    }

  }, intervalMs);

  recoveryTimer.unref?.();

}



export async function checkRedisHealth(): Promise<'up' | 'down' | 'degraded'> {

  if (!env.redis.enabled) return 'degraded';

  if (!initAttempted) getRedisClient();

  if (usingFallback) {

    void attemptRedisRecovery();

    return 'degraded';

  }

  try {

    const pong = await getRedisClient().ping();

    return pong === 'PONG' ? 'up' : 'down';

  } catch {

    activateFallback('health check failed');

    return 'degraded';

  }

}



export async function closeRedis(): Promise<void> {

  if (recoveryTimer) {

    clearInterval(recoveryTimer);

    recoveryTimer = null;

  }

  if (!client) return;

  try {

    await client.quit();

  } catch {

    client.disconnect();

  }

  client = null;

  realRedis = null;

}



export async function acquireLock(lockKey: string, ttlSeconds: number): Promise<boolean> {

  const redis = getRedisClient();

  const token = `${process.pid}:${Date.now()}`;

  const key = `lock:${lockKey}`;



  if (usingFallback) {

    const existing = await redis.get(key);

    if (existing) return false;

    await redis.setex(key, ttlSeconds, token);

    return true;

  }



  try {

    const result = await redis.set(key, token, 'EX', ttlSeconds, 'NX');

    return result === 'OK';

  } catch (err) {

    activateFallback(err instanceof Error ? err.message : 'lock acquisition failed');

    const existing = await getRedisClient().get(key);

    if (existing) return false;

    await getRedisClient().setex(key, ttlSeconds, token);

    return true;

  }

}



export async function releaseLock(lockKey: string): Promise<void> {

  await getRedisClient().del(`lock:${lockKey}`);

}



export async function cacheGet<T>(key: string): Promise<T | null> {

  const raw = await getRedisClient().get(`cache:${key}`);

  if (!raw) return null;

  try {

    return JSON.parse(raw) as T;

  } catch {

    return null;

  }

}



export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {

  await getRedisClient().setex(`cache:${key}`, ttlSeconds, JSON.stringify(value));

}



export async function rateLimitCheck(key: string, limit: number, windowSeconds: number): Promise<boolean> {

  const redis = getRedisClient();

  const redisKey = `ratelimit:${key}`;

  const count = await redis.incr(redisKey);

  if (count === 1) await redis.expire(redisKey, windowSeconds);

  return count <= limit;
}
