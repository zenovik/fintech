# Payment Traceability

> **Phase 2 — Code Traceability** · v1.0.0-rc1 · 2026-07-29

---

## Full Chain (FR-PAY-001 → FR-PAY-007)

| Layer | Artifact | Evidence |
|-------|----------|----------|
| FR | FR-PAY-001–007 | Functional_Requirements.md |
| BR | BR-PAY-* (payment rules) | Business_Rules.md §Payments |
| FE admin | transaction-api.service.ts, payments pages | features/transactions/ |
| FE public | checkout-api.service, HostedCheckoutComponent | features/checkout/ |
| API create | POST /api/v1/payments | payment.routes.ts |
| API authorize | POST /api/v1/payments/:id/authorize | payment.routes.ts |
| API capture | POST /api/v1/payments/:id/capture | payment.routes.ts |
| Middleware | authenticate, authorize, organization, idempotency header | payment.routes.ts |
| DTO | payments/dto/*.ts (Zod) | |
| Controller | payment.controller.ts | |
| Service | payment-engine.service.ts | state machine |
| Status constants | payment-status.ts (11 states) | |
| Repository | payment.repository.ts | |
| Tables | payment_intents, payment_orders, payment_timeline_events, payment_idempotency_keys | |
| Webhook side effect | payment_webhook_deliveries | payment-webhook.service.ts |
| Worker | webhook_delivery job | job-handlers.ts |
| Audit | auditRecorder on transitions | |
| Log | request-logging.middleware | |
| Swagger | /api/docs | |
| Integration | payments.integration.test.ts, payment-transactions.integration.test.ts | |
| E2E | payments.spec.ts, checkout.spec.ts | |
| k6 | performance/helpers/payments.js | |
| Product doc | Modules/Payments.md, Payment_Lifecycle.md | |
| Architecture | Payment_Architecture.md | |

## State Machine

**Evidence:** `Backend_Fintech/src/app/modules/payments/constants/payment-status.ts` — 11 states documented in Payment_Lifecycle module doc.

## Cross References

- [Webhook_Traceability.md](./Webhook_Traceability.md)
