# Backend Traceability

> **Phase 2 — Code Traceability** · v1.0.0-rc1 · 2026-07-29

---

## Layer Model

```
HTTP Request
  → helmet, cors, compression, cookie-parser
  → requestContextMiddleware
  → requestLoggingMiddleware
  → /api/auth → authRoutes
  → /api/v1 → globalRateLimit, apiRateLimit, featureFlagGuard
  → organizationMiddleware, merchantMiddleware (context)
  → module router → authenticate → authorize(permissions)
  → controller → service → repository → mysql2
  → errorHandler
```

**Evidence:** `Backend_Fintech/src/app/app.ts`

## Module Registry (46 + shared)

| Module | Routes | Controller | Service | Repository | Called by |
|--------|--------|------------|---------|------------|-----------|
| auth | auth.routes.ts | auth.controller | auth, token, password | 9 repos | FE auth.service, all API clients |
| payments | payment.routes.ts | payment.controller | payment-engine, payment-webhook | payment.repository | FE transaction-api, checkout, e2e |
| webhooks | webhooks.routes.ts | webhooks.controller | webhooks.service | webhooks.repository | FE webhooks-api, worker |
| notifications | notification.routes.ts | notification.controller | notification, notification-dispatch | notification.repository | FE, worker |
| settings | settings.routes.ts | settings.controller | settings, platform-config | 2 repos | FE settings-api |
| *… 41 others* | per module | per module | per module | per module | FE *-api.service or NOT VERIFIED |

## Shared Consumers

| Shared artifact | Producers | Consumers |
|-----------------|-----------|-----------|
| background-job.service | auth, invoices, notifications | worker job-handlers |
| auditRecorder | most write services | audit_logs table |
| email.service | worker, auth | SMTP |
| cache.service | settings | Redis/in-memory |
| webhookDeliveryProcessor | payments, webhooks | worker |

## Middleware Traceability

| Middleware | Who invokes | Who it affects |
|------------|-------------|----------------|
| authenticate | route-level | Sets req.user |
| authorize | route-level | 403 if missing permission |
| organizationMiddleware | /api/v1 global | req.organizationId |
| merchantMiddleware | merchant routes | outlet scope |
| csrf.middleware | mutating cookie auth | 403 invalid CSRF |
| featureFlagGuard | /api/v1 global | 503 if flag disables route |

## Tests

17 integration test files — see [Requirements_to_Test.md](./Requirements_to_Test.md).

## Cross References

- [05_Repository_Audit/Backend_Inventory.md](../05_Repository_Audit/Backend_Inventory.md)
- [API_Traceability.md](./API_Traceability.md)
