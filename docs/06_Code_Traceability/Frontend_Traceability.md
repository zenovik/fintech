# Frontend Traceability

> **Phase 2 — Code Traceability** · v1.0.0-rc1 · 2026-07-29

---

## Summary

| Artifact | Count | Routed | Evidence |
|----------|------:|--------|----------|
| Components | 153 | ~148 via lazy routes | `**/*.component.ts` |
| Feature API services | 38 | — | `*-api.service.ts` |
| State services | ~12 | — | `*-state.service.ts` |
| Guards | 3 | app.routes.ts | auth, guest, permission |
| Interceptors | 1 | app.config.ts | auth.interceptor |
| Pipes / Directives | 0 | — | empty folders |

## Feature → Route → Service → API

| Feature | App route | API service | Backend prefix |
|---------|-----------|-------------|----------------|
| authentication | `/auth/*` | core/auth/services/auth.service.ts | `/api/auth` |
| dashboard | `/dashboard/*` | dashboard-api.service.ts | `/api/v1/dashboard/executive` |
| merchant | `/merchants/*` | merchant-api.service.ts | `/api/v1/merchants` |
| payments (admin) | `/transactions/*` | transaction-api.service.ts | `/api/v1/transactions` |
| checkout (public) | `/pay/checkout/:ref` | checkout-api.service.ts | `/api/v1/public/checkout` |
| payment-links | `/payment-links/*` | payment-links-api.service.ts | `/api/v1/payment-links` |
| webhooks | `/webhooks/*` | webhooks-api.service.ts | `/api/v1/webhooks` |
| settings | `/settings/*` | settings-api.service.ts, system-api.service.ts | `/api/v1/settings`, `/api/v1/system` |
| permissions | **NO ROUTE** | permission-api.service.ts only | `/api/v1/permissions` via roles |

## Shell Components (eager)

DashboardShellComponent, SettingsShellComponent, AuditShellComponent, NotificationsShellComponent — used as route parents.

## Per-Component Detail

Full per-component Inputs/Outputs/Signals mapping: **NOT VERIFIED** — requires AST analysis of 153 files.

## Unused / Dead (High confidence)

| Item | Evidence |
|------|----------|
| `features/merchants/` empty folder | Phase 1 audit |
| No standalone permissions UI | service only |

## Tests

| Type | Coverage |
|------|----------|
| Karma unit specs | **NOT VERIFIED** — `*.spec.ts` count not confirmed |
| Playwright E2E | 16 specs — partial feature coverage |

## Cross References

- [05_Repository_Audit/Frontend_Inventory.md](../05_Repository_Audit/Frontend_Inventory.md)
- [API_Traceability.md](./API_Traceability.md)
