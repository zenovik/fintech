# Redis Integration Guide

Redis powers queues coordination, distributed locks, caching, and rate limiting with graceful in-memory fallback.

## Configuration

```env
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379
```

Set `REDIS_ENABLED=false` to force in-memory mode (development only).

## Failure Handling

When Redis is enabled but unreachable:

1. The client immediately serves requests through the in-memory fallback (startup never fails).
2. A warning is logged: `Redis degraded — using in-memory fallback`.
3. `checkRedisHealth()` returns `degraded` and triggers a recovery attempt.
4. `startRedisRecoveryLoop()` polls every 60 seconds and reconnects automatically when Redis becomes available.

Lock acquisition falls back to in-memory locks if Redis errors occur mid-operation.

## Usage Areas

| Feature | Key pattern | Fallback |
|---------|-------------|----------|
| Worker locks | `lock:job:{id}` | In-memory Map |
| Worker heartbeat | `worker:heartbeat` | None (readiness degrades) |
| Read cache | `cache:{key}` | Per-process memory |
| Rate limits | `ratelimit:{key}` | Per-process memory |

## Caching Policy

- **Safe to cache:** Dashboard KPI snapshots, analytics aggregates, feature flags (60–300s TTL)
- **Never cache:** Payment intents, transactions, checkout sessions, settlement balances
- TTL configured via `cache_configurations` table and `CacheService`

## Cache Invalidation

Update cache config via `PUT /api/v1/system/cache-config/:id`. Money-path data is never cached by `CacheService` (prefix guard on `payment:`, `transaction:`, etc.).

## Production

Docker Compose includes `redis:7-alpine`. Both `backend` and `worker` services connect to `redis://redis:6379`.

## Health

- `/api/health` — includes `redis` component state
- `/api/ready` — `dependencies.redis` must be `up` or fallback active

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Readiness `worker: false` | Worker not running | Start worker process |
| `redis: degraded` | Fallback active | Start Redis or check `REDIS_URL` |
| Stale dashboard KPI | Cache TTL | Lower TTL in cache_configurations |
