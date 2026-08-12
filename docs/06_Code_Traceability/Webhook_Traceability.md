# Webhook Traceability

> **Phase 2 — Code Traceability** · v1.0.0-rc1 · 2026-07-29

---

## Chain (FR-WH-001 → FR-WH-004)

| Layer | Artifact |
|-------|----------|
| FR | FR-WH-001–004 |
| FE | webhooks-api.service.ts, WebhooksDashboardComponent |
| API CRUD | /api/v1/webhooks/endpoints/* |
| API deliveries | /api/v1/webhooks/deliveries/*, retry |
| Controller | webhooks.controller.ts |
| Service | webhooks.service.ts |
| Delivery engine | shared/webhooks/webhook-delivery.engine.ts |
| HMAC sign | FR-WH-004 — engine **NOT VERIFIED** line without reading file |
| Tables | webhook_endpoints, webhook_subscriptions, webhook_delivery_queue, webhook_deliveries |
| Payment WH | payment_webhook_deliveries | payment-webhook.service.ts |
| Worker | webhook_delivery job type | job-handlers.ts |
| Retry | retry_queue, WEBHOOK_RETRY_* env, operations retry API | |
| Audit | webhook-logs in audit module | /api/v1/audit/webhook-logs |
| Test | webhooks-workers.integration.test.ts, webhooks.spec.ts | |
| Doc | Modules/Webhooks.md, Webhook_Architecture.md | |

## Cross References

- [Worker_Traceability.md](./Worker_Traceability.md)
