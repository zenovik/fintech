# Worker Traceability

> **Phase 2 — Code Traceability** · v1.0.0-rc1 · 2026-07-29

---

## End-to-End Chain

| Stage | Component | Evidence |
|-------|-----------|----------|
| Producer | domain services enqueue | auth.service, invoice.service, payment-webhook |
| Queue | background_jobs, retry_queue, notification_deliveries, payment_webhook_deliveries, webhook_delivery_queue | worker-runner.ts |
| Consumer | worker.ts → worker-runner.ts → job-handlers.ts | |
| Lock | Redis acquireLock/releaseLock | redis.client.ts |
| Complete | UPDATE status completed/failed | background_jobs |
| Retry | retry_queue + exponential backoff env | WEBHOOK_RETRY_* |
| Dead letter | operations dead-letter-queue API | operations.routes.ts |
| Heartbeat | Redis worker:heartbeat | worker-healthcheck.js |
| Metrics | recordMetric in worker | metrics.registry.ts |
| Logs | logger in job-handlers | shared/logger |

## Job Type Matrix

| job_type | Producer | Handler | Output |
|----------|----------|---------|--------|
| password_reset_email | auth.service.ts | handlePasswordResetEmail | SMTP email |
| invoice_email | invoice.service.ts | handleInvoiceEmail | SMTP email |
| notification_email | notification-dispatch | handleNotificationEmail | SMTP email |
| webhook_delivery | payment/webhook services | webhookDeliveryProcessor | HTTPS POST merchant |
| unknown | any orphan enqueue | audit unknown_job_type | failed job |

## Scheduler

`processScheduledTasks()` reads `background_job_schedules` each tick — **NOT VERIFIED** cron expression format.

## Cross References

- [02_Architecture/Worker_Architecture.md](../02_Architecture/Worker_Architecture.md)
- [05_Repository_Audit/Worker_Inventory.md](../05_Repository_Audit/Worker_Inventory.md)
