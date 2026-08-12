# Enterprise V2 — Financial Core Engine

Phase 10 production financial capabilities integrated with existing architecture.

## Modules

| Engine | Location | Description |
|--------|----------|-------------|
| Double-Entry Ledger | `shared/financial/posting-engine.service.ts` | Journal entries, lines, balance validation, reversal |
| Settlement | `shared/financial/settlement-processor.service.ts` | Daily/weekly/manual batch settlement worker |
| Payout | `shared/financial/payout-processor.service.ts` | Scheduled payout batch with bank verification |
| Accounting | `modules/accounting/` | Trial balance, month close, journal API |
| Gateway | `modules/gateway/` | Stripe, Razorpay, internal adapters |
| Event Bus | `shared/events/event-bus.service.ts` | Outbox pattern, dead letter, replay |
| Reconciliation | `modules/reconciliation/` | Auto-match import records |

## Database

Schema: `Database_Fintech/structure_queries/080_financial_core_engine.sql`

Apply: `npm run db:build && npm run db:setup`

## API Endpoints (new)

- `POST /api/v1/accounting/journals` — post journal (ledger:post)
- `POST /api/v1/accounting/journals/:id/reverse` — reverse journal
- `GET /api/v1/accounting/trial-balance`
- `GET /api/v1/accounting/validate-balances`
- `POST /api/v1/accounting/periods/close`
- `POST /api/v1/settlements/batch/run`
- `POST /api/v1/reconciliation/imports/:id/auto-match`
- `GET /api/v1/gateway/providers`
- `GET /api/v1/gateway/transactions`
- `GET /api/v1/events/dead-letter`
- `POST /api/v1/events/dead-letter/:id/replay`
- `GET /metrics` — Prometheus exposition

## Workers

| Job Type | Schedule | Handler |
|----------|----------|---------|
| `settlement_batch` | Daily 02:00 | SettlementProcessor.runDailyBatch |
| `payout_batch` | Daily 04:00 | PayoutProcessor.runScheduledBatch |
| `outbox_publish` | Every minute | EventBus.processOutboxBatch |

## Environment

```
PAYMENT_GATEWAY_PROVIDER=internal|stripe|razorpay
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
OTEL_TRACING_ENABLED=true
PROMETHEUS_METRICS_ENABLED=true
```

## Events

Domain events published via outbox on payment capture, settlement, payout.

Integration-ready for Kafka/RabbitMQ via outbox relay worker.
