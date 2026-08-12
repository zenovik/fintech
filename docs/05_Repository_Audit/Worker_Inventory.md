# Worker Inventory

> **Phase 1 — Repository Audit** · v1.0.0-rc1 · Evidence from worker source · 2026-07-29

---

## Process Model

| Item | Value |
|------|-------|
| Entry file | `Backend_Fintech/src/worker.ts` |
| Runner | `shared/workers/worker-runner.ts` |
| Handlers | `shared/workers/job-handlers.ts` |
| Docker service | `worker` — `node dist/worker.js` |
| Poll interval | `WORKER_POLL_INTERVAL_MS` (default 3000) |
| Concurrency | `WORKER_CONCURRENCY` (default 5) |
| Batch size | `WORKER_BATCH_SIZE` (default 10) |
| Lock TTL | `WORKER_LOCK_TTL_SECONDS` (default 120) |

## Job Types (background_jobs.job_type)

| Type | Handler | Enqueued from |
|------|---------|---------------|
| `invoice_email` | handleInvoiceEmail | invoice.service.ts |
| `webhook_delivery` | webhookDeliveryProcessor | payment/webhook flows |
| `notification_email` | handleNotificationEmail | notification dispatch |
| `password_reset_email` | handlePasswordResetEmail | auth.service.ts |
| *(unknown)* | Logs + audit + fail | default switch case |

## Queue Tables

| Table | Worker operation |
|-------|------------------|
| `background_jobs` | Claim `FOR UPDATE`, status queued→running→completed/failed |
| `background_job_schedules` | Auto-enqueue on tick (see Scheduler) |
| `retry_queue` | processRetryQueueItem |
| `notification_deliveries` | Pending email deliveries |
| `payment_webhook_deliveries` | Payment webhook outbound |
| `webhook_delivery_queue` | General webhook queue |

## Retry Types (retry_queue)

**Evidence:** job-handlers.ts `processRetryQueueItem` — types include webhook_retry, payment_webhook_retry, email_retry (**NOT VERIFIED** exhaustive enum without full file read).

## Redis Locks

| Lock prefix | Purpose |
|-------------|---------|
| `job:*` | Background job |
| `retry:*` | Retry item |
| `notif:*` | Notification delivery |
| `pwd:*` | Password reset email |
| `wdq:*` | Webhook delivery queue |

## Heartbeat

Redis key: `worker:heartbeat` — checked by `scripts/worker-healthcheck.js`

## Metrics

`recordMetric` calls in worker-runner — exposed via API metrics endpoint.

## Idle Behavior

When no work: `emailService.retryFailedEmails()` on idle ticks.

## Cross References

- [Scheduler_Inventory.md](./Scheduler_Inventory.md)
- [02_Architecture/Worker_Architecture.md](../02_Architecture/Worker_Architecture.md)
- Backend docs: `Backend_Fintech/docs/WORKER.md`
