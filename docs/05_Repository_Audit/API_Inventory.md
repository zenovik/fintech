# API Inventory

> **Phase 1 — Repository Audit** · v1.0.0-rc1 · Static analysis of route files · 2026-07-29

---

## Summary

| Metric | Count |
|--------|------:|
| Router-defined endpoints | 562 |
| Auth endpoints (`/api/auth`) | 16 |
| Versioned API (`/api/v1/*`) | 543 |
| App health | 3 (`/api/live`, `/api/ready`, `/api/health`) |
| Swagger | `/api/docs`, `/api/docs.json` |
| Route mount groups | 48 |
| Controllers | 47 |

**Registration evidence:** `Backend_Fintech/src/app/app.ts`

## Authentication Model

| Route class | Auth | Evidence |
|-------------|------|----------|
| `/api/auth/*` | Mixed — login public, `/me` protected | auth.routes.ts + auth.middleware |
| `/api/v1/public/*` | Public (checkout, payment-links, qr) | no auth middleware on public routers |
| `/api/v1/settings/public/*` | Public branding/flags | settings.routes.ts |
| Remaining `/api/v1/*` | JWT Bearer or cookie + org context | auth + organization middleware |

## Authorization

RBAC via `authorize(...permissions)` — 144 permissions in `shared/rbac/permissions.ts`.

**Per-endpoint permission mapping:** **NOT VERIFIED** in this audit (requires per-route grep).

## Validation

Zod DTOs in module `dto/` folders; CSRF on mutating cookie-auth requests.

## Endpoints by Module

| Mount prefix | Endpoints | Controller | Swagger | Integration tests |
|--------------|----------:|------------|---------|-------------------|
| `/api/auth` | 16 | auth.controller | Yes | auth.integration.test.ts |
| `/api/v1/payments` | 18 | payment.controller | Yes | payments.integration.test.ts |
| `/api/v1/checkout` + public | 11 | checkout.controller | Yes | checkout.integration.test.ts |
| `/api/v1/webhooks` | 14 | webhooks.controller | Yes | webhooks.integration.test.ts |
| `/api/v1/merchants` | 14 | merchant.controller | Yes | merchants.integration.test.ts |
| `/api/v1/organizations` | 24 | organization.controller | Yes | organizations.integration.test.ts |
| `/api/v1/invoices` | 28 | invoice.controller | Yes | **NOT VERIFIED** dedicated test |
| `/api/v1/notifications` | 24 | notification.controller | Yes | **NOT VERIFIED** |
| `/api/v1/settings` | 30 | settings.controller | Yes | settings.integration.test.ts |
| `/api/v1/analytics` | 18 | reports (analytics) | Yes | **NOT VERIFIED** |
| `/api/v1/operations` | 22 | operations.controller | Yes | **NOT VERIFIED** |
| `/api/v1/merchant-onboarding` | 16 | merchant-onboarding.controller | Yes | onboarding.integration.test.ts |
| `/api/v1/subscriptions` | 14 | subscription.controller | Yes | subscriptions.integration.test.ts |
| `/api/v1/reports` + center | 20 | report-center, reports | Yes | reports.integration.test.ts |
| `/api/v1/system` | 12 | system.controller | Yes | system.integration.test.ts |
| `/api/v1/ai` | 7 | ai.controller | Yes | **NOT VERIFIED** |
| *Remaining 30 modules* | ~280 | various | Partial | Partial |

## Worker / Async Side Effects

| Endpoint action | Async mechanism |
|-----------------|-----------------|
| Password reset | `background_jobs` type `password_reset_email` |
| Invoice send email | `invoice_email` job |
| Payment capture | `payment_webhook_deliveries` → worker |
| Webhook retry | `retry_queue`, operations retry endpoints |

## Notifications

In-app via `notifications` table; email via worker + `notification_deliveries`.

## Complete Endpoint Listing

Full 562-endpoint table maintained in backend reverse-engineering artifact. Key route files:

```
Backend_Fintech/src/app/modules/*/routes/*.routes.ts
Backend_Fintech/src/app/modules/auth/routes/auth.routes.ts
Backend_Fintech/src/app/app.ts (health)
```

## Test Coverage (API)

| Test type | Files | Covers |
|-----------|------:|--------|
| Integration | 17 | auth, payments, checkout, webhooks, orgs, merchants, refunds, etc. |
| Unit | 3 | security, production smoke, remediation |
| E2E | 16 specs | UI flows hitting API |

**Endpoints without integration test:** **NOT VERIFIED** exhaustive list — estimate ~60% module coverage.

## Cross References

- Swagger UI: `GET /api/docs` (runtime)
- Postman: `Postman/README.md`
- Product FRs: [01_Product/Functional_Requirements.md](../01_Product/Functional_Requirements.md)
- Architecture: [02_Architecture/Integration_Architecture.md](../02_Architecture/Integration_Architecture.md)
