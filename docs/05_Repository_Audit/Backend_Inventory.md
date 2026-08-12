# Backend Inventory

> **Phase 1 — Repository Audit** · v1.0.0-rc1 · Evidence from Backend_Fintech source · 2026-07-29

---

## Summary

| Artifact | Count | Location pattern |
|----------|------:|------------------|
| Domain modules | 46 | `src/app/modules/*/` |
| Controllers | 47 | `**/*.controller.ts` |
| Services | 67 | `**/*.service.ts` |
| Repositories | 61 | `**/*.repository.ts` |
| Route files | 48 | `**/*.routes.ts` + `app.ts` |
| Middleware | 13 | `*middleware*.ts` |
| HTTP endpoints | 562 | router static analysis |
| Unit tests | 3 | `src/__tests__/*.test.ts` |
| Integration tests | 17 | `*.integration.test.ts` |

## Module Registry

| Module | Route prefix | Controller | Service(s) | Repository |
|--------|-------------|------------|------------|------------|
| auth | `/api/auth` | auth.controller | auth, token, password | 9 auth repos |
| payments | `/api/v1/payments` | payment.controller | payment-engine, payment-webhook | payment.repository |
| checkout | `/api/v1/checkout`, `/api/v1/public/checkout` | checkout.controller | checkout.service | checkout.repository |
| webhooks | `/api/v1/webhooks` | webhooks.controller | webhooks.service | webhooks.repository |
| merchant | `/api/v1/merchants` | merchant.controller | merchant.service | merchant.repository |
| organizations | `/api/v1/organizations` | organization.controller | organization.service | organization.repository |
| refunds | `/api/v1/refunds` | refund.controller | refund.service | refund.repository |
| chargebacks | `/api/v1/chargebacks` | chargeback.controller | chargeback.service | chargeback.repository |
| notifications | `/api/v1/notifications` | notification.controller | notification, notification-dispatch | notification.repository |
| settings | `/api/v1/settings` | settings.controller | settings, platform-config | 2 repos |
| system | `/api/v1/system` | system.controller | health, system-config | system.repository |
| ai | `/api/v1/ai` | ai.controller | 5 AI services | ai-insights.repository |
| operations | `/api/v1/operations` | operations.controller | operations.service | operations.repository |
| *… 33 more modules* | See API_Inventory.md | — | — | — |

**Full module list (46):** acceptance, accounting, activity, ai, audit, auth, chargebacks, checkout, customers, dashboard, developer, devices, exports, fraud, invoices, merchant, merchant-onboarding, merchant-users, notifications, onboarding-approval, operations, organizations, outlets, payment-config, payment-links, payments, payouts, permissions, pricing, qr-payments, reconciliation, refunds, reports, risk-rules, roles, sandbox, search, settings, settlements, smart-collect, subscriptions, support, system, transactions, users, webhooks

## Middleware Inventory

| File | Purpose | Applied |
|------|---------|---------|
| `error-handler.middleware.ts` | Global error JSON | app-wide |
| `csrf.middleware.ts` | CSRF token validation | mutating routes |
| `request-logging.middleware.ts` | Request audit log | app-wide |
| `request-context.middleware.ts` | X-Request-Id | app-wide |
| `global-rate-limit.middleware.ts` | 15-min global limit | `/api/v1` |
| `feature-flag.middleware.ts` | DB feature flags | `/api/v1` |
| `auth.middleware.ts` | JWT authentication | protected routes |
| `organization.middleware.ts` | Tenant context | `/api/v1` |
| `merchant.middleware.ts` | Merchant/outlet scope | merchant routes |
| `authorize.middleware.ts` | RBAC permissions | per-route |
| `dashboard-auth.middleware.ts` | Dashboard auth | dashboard routes |
| `ai-rate-limit.middleware.ts` | AI rate limit | AI routes |
| `not-found.middleware.ts` | 404 handler | last |

**Also:** helmet, cors, compression from `config/http-security.ts`

## Shared Services

| Service | Path | Consumers |
|---------|------|-----------|
| background-job.service | shared/jobs | Enqueue async work |
| email.service | shared/email | Worker, auth, invoices |
| cache.service | shared/cache | Settings, platform config |
| export-file.service | shared/export | Reports, exports |

## Worker Entry

| File | Role |
|------|------|
| `src/worker.ts` | Validates env, starts Redis recovery, worker loop |
| `shared/workers/worker-runner.ts` | Poll loop, claim jobs, heartbeat |
| `shared/workers/job-handlers.ts` | Job type dispatch |

## Validators

Validation via **Zod schemas** in module `dto/` folders — no separate validator class layer.

**Evidence:** `*.dto.ts` files co-located with routes/controllers per module.

## Cross References

- API detail: [API_Inventory.md](./API_Inventory.md)
- Worker: [Worker_Inventory.md](./Worker_Inventory.md)
- Architecture: [02_Architecture/Component_Diagram.md](../02_Architecture/Component_Diagram.md)
