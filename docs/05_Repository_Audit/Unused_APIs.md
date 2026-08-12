# Unused APIs

> **Phase 1 — Repository Audit** · v1.0.0-rc1 · 2026-07-29

---

## Method

562 backend endpoints vs frontend service calls — **full cross-reference NOT VERIFIED** (requires automated static linking).

## Likely Low-Traffic / Admin-Only APIs

These have backend routes but **no dedicated frontend feature route** or minimal UI:

| API prefix | Endpoints | Frontend feature | Gap |
|------------|----------:|------------------|-----|
| `/api/v1/accounting` | 4 | **NOT FOUND** | No accounting feature folder |
| `/api/v1/pricing` | 3 | **NOT FOUND** | No pricing feature |
| `/api/v1/payment-config` | 4 | Partial via settings | **NOT VERIFIED** |
| `/api/v1/acceptance` | 4 | acceptance feature | UI exists |
| `/api/v1/ai` | 7 | AI widgets in dashboard/shared | Partial coverage |

## Public APIs (by design, no admin UI)

| Prefix | Purpose |
|--------|---------|
| `/api/v1/public/checkout` | Hosted checkout |
| `/api/v1/public/payment-links` | Public pay |
| `/api/v1/public/qr-payments` | Public QR pay |

## Integration Test Coverage Gaps

Modules **without** dedicated `*.integration.test.ts` file (17 files exist):

accounting, ai, acceptance, activity, analytics-only, chargebacks (has e2e), customers, devices, fraud, invoices, operations, payment-config, pricing, qr-payments, sandbox, smart-collect, support, reconciliation, payouts, settlements, transactions

**Note:** Some may be covered indirectly — **NOT VERIFIED**.

## E2E Coverage (16 specs)

Modules with E2E: auth, checkout, merchants, payments, users, rbac, audit, reports, chargebacks, subscriptions, webhooks, payment-links, qr-payments, developer-settings, errors, responsive

**No E2E spec file:** settlements, payouts, fraud, smart-collect, reconciliation, operations, sandbox, organizations, invoices, etc.

## Swagger

All mounted routes intended for documentation at `/api/docs` — does not imply frontend usage.

## Cross References

- [API_Inventory.md](./API_Inventory.md)
- [Frontend_Inventory.md](./Frontend_Inventory.md)
