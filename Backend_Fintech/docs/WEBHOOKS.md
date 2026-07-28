# Webhook Delivery Guide

Platform webhooks are delivered by the background worker using real HTTP POST requests with HMAC signing.

## Delivery Flow

1. Application code enqueues a row in `webhook_delivery_queue` (or `payment_webhook_deliveries`).
2. Worker claims pending rows each tick.
3. `webhook-delivery.engine.ts` performs HTTP POST via `fetch`.
4. Attempt count, status, and response code are persisted after each attempt.
5. Failed deliveries schedule exponential backoff retries until `max_attempts`.

## Replay / Manual Retry

`POST /api/v1/webhooks/deliveries/:id/retry` (authenticated):

1. Resets delivery to retryable state via `retryDelivery()`.
2. Creates a `webhook_replay_history` row with status `pending`.
3. Executes `processQueueDelivery()` immediately (real HTTP delivery).
4. Updates replay history to `success` or `failed` based on the HTTP result.

Replay history is preserved; each retry creates a new replay record.

## Security

- Payloads are signed with `X-Webhook-Signature: t=<unix>,v1=<hmac>` when a merchant secret exists.
- Secrets are resolved from encrypted storage; never logged in plaintext.
- Timeouts default to `WEBHOOK_TIMEOUT_MS` (15s).

## Monitoring

- Delivery metrics: `webhook.delivery` in worker metrics snapshot.
- Admin queue depths: `GET /api/v1/system/admin/status`.
- Audit webhook logs: `GET /api/v1/audit/webhook-logs`.

## Worker Requirement

Webhook delivery requires the worker process (`npm run worker`). Without it, deliveries remain queued.
