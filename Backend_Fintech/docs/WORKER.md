# Worker Process Guide

The background worker runs independently from the HTTP API and processes operational queues.

## What It Processes

| Queue | Source table | Handler |
|-------|--------------|---------|
| Payment webhooks | `payment_webhook_deliveries` | HTTP POST with HMAC |
| Platform webhooks | `webhook_delivery_queue` | HTTP POST with HMAC |
| Background jobs | `background_jobs` | Invoice email, password reset, notifications |
| Retry queue | `retry_queue` | Webhook/email retries (claimed with `FOR UPDATE`) |
| Notification email | `notification_deliveries` | SMTP via Nodemailer |
| Scheduled tasks | `background_job_schedules` | Enqueues periodic jobs |

## Running Locally

```bash
# Terminal 1 — API
npm run dev --workspace=Backend_Fintech

# Terminal 2 — Worker
npm run worker --workspace=Backend_Fintech
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `WORKER_POLL_INTERVAL_MS` | 3000 | Poll interval between ticks |
| `WORKER_CONCURRENCY` | 5 | Parallel task execution |
| `WORKER_BATCH_SIZE` | 10 | Items claimed per queue per tick |
| `WORKER_LOCK_TTL_SECONDS` | 120 | Redis lock TTL |
| `WEBHOOK_TIMEOUT_MS` | 15000 | HTTP delivery timeout |
| `REDIS_URL` | redis://localhost:6379 | Required for multi-instance locks |

## Docker

The `worker` service in `docker-compose.yml` runs `node dist/worker.js`.

Readiness checks use Redis key `worker:heartbeat` (30s TTL).

## Graceful Shutdown

Send `SIGTERM` or `SIGINT`. The worker completes the current tick, releases locks, closes Redis and DB connections.

## Monitoring

- Worker metrics: `GET /api/v1/system/metrics` (authenticated)
- Admin status: `GET /api/v1/system/admin/status` includes worker state and queue depths

## Duplicate Prevention

Redis distributed locks (`lock:pwd:*`, `lock:job:*`, etc.) prevent duplicate processing across worker instances. In-memory fallback is used when Redis is unavailable (single-process only).

Background jobs, retry queue, notification email, and webhook queue items are claimed inside DB transactions using `SELECT ... FOR UPDATE`.

| Queue | Claim behavior |
|-------|----------------|
| Background jobs | `FOR UPDATE` + status `running` |
| Retry queue | `FOR UPDATE` + status `processing` |
| Notification email | `FOR UPDATE` (serialized claim) |
| Webhook delivery queue | `FOR UPDATE` + status `processing` |
| Payment webhooks | `FOR UPDATE` (serialized claim) |

## Docker Healthcheck

The worker container healthcheck verifies a fresh Redis heartbeat (`worker:heartbeat`, max age 60s) via `scripts/worker-healthcheck.js`.

## Job Types

| Job type | Handler |
| -------- | ------- |
| `invoice_email` | SMTP invoice delivery |
| `password_reset_email` | Password reset link email |
| `notification_email` | Notification delivery by delivery ID |
| `webhook_delivery` | Delegates to webhook delivery engine |

Unknown job types are marked **failed**, audited as `unknown_job_type`, and do not block subsequent ticks.

## Notification Email

When a notification is created, an `in_app` delivery is always inserted. If the user's notification preferences (or system defaults) enable email for that event type, a `pending` email delivery row is also created. The worker picks up pending email deliveries each tick.

See [PASSWORD_RESET.md](./PASSWORD_RESET.md) and [WEBHOOKS.md](./WEBHOOKS.md) for related flows.
