import Redis from 'ioredis';

async function main() {
  const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const redis = new Redis(url, {
    maxRetriesPerRequest: 1,
    connectTimeout: 3000,
    lazyConnect: true,
  });

  try {
    await redis.connect();
    const heartbeat = await redis.get('worker:heartbeat');
    if (!heartbeat) {
      process.exit(1);
    }
    const ageMs = Date.now() - Date.parse(heartbeat);
    process.exit(Number.isFinite(ageMs) && ageMs <= 60_000 ? 0 : 1);
  } catch {
    process.exit(1);
  } finally {
    await redis.quit().catch(() => redis.disconnect());
  }
}

void main();
