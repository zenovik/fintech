# Requirements to API

> **Phase 2 — Code Traceability** · v1.0.0-rc1 · 2026-07-29

---

| FR ID | Primary API endpoints (evidence: route files) | Mount |
|-------|-----------------------------------------------|-------|
| FR-AUTH-001 | POST `/api/auth/login` | auth.routes.ts |
| FR-AUTH-002–003 | POST `/api/auth/verify-otp`, `/resend-otp` | auth.routes.ts |
| FR-AUTH-004 | POST `/api/auth/refresh-token` | auth.routes.ts |
| FR-AUTH-005 | POST `/api/auth/logout` | auth.routes.ts |
| FR-AUTH-006–007 | POST `/api/auth/forgot-password`, `/reset-password` | auth.routes.ts |
| FR-AUTH-008 | POST `/api/auth/select-organization` | auth.routes.ts |
| FR-AUTH-009 | GET/DELETE `/api/auth/sessions*` | auth.routes.ts |
| FR-AUTH-010 | GET `/api/auth/csrf-token` | auth.routes.ts |
| FR-RBAC-001–004 | All `/api/v1/*` with `authorize()` | per-route |
| FR-MER-001–003 | `/api/v1/merchants/*` | merchant.routes.ts |
| FR-MER-004–005 | `/api/v1/merchant-onboarding/*`, `/api/v1/onboarding-approval/*` | respective routes |
| FR-MER-006 | `/api/v1/outlets/*` | outlet.routes.ts |
| FR-PAY-001–007 | `/api/v1/payments/*` | payment.routes.ts |
| FR-CHK-001–003 | `/api/v1/checkout/*`, `/api/v1/public/checkout/*` | checkout.routes.ts |
| FR-PL-001–002 | `/api/v1/payment-links/*`, `/api/v1/public/payment-links/*` | payment-link.routes.ts |
| FR-QR-001–002 | `/api/v1/qr-payments/*`, `/api/v1/public/qr-payments/*` | qr-payment.routes.ts |
| FR-REF-001–003 | `/api/v1/refunds/*` | refund.routes.ts |
| FR-CB-001–002 | `/api/v1/chargebacks/*` | chargeback.routes.ts |
| FR-SUB-001–002 | `/api/v1/subscriptions/*` | subscription.routes.ts |
| FR-INV-001–002 | `/api/v1/invoices/*` | invoice.routes.ts |
| FR-DEV-001–003 | `/api/v1/developer/*` | developer.routes.ts |
| FR-WH-001–004 | `/api/v1/webhooks/*` | webhooks.routes.ts |
| FR-SBX-001–002 | `/api/v1/sandbox/*` | sandbox.routes.ts |
| FR-RPT-001–003 | `/api/v1/reports/*`, `/api/v1/analytics/*` | reports.routes.ts |
| FR-RPT-004 | `/api/v1/dashboard/executive/*` | executive-dashboard.routes.ts |
| FR-AUD-001–002 | `/api/v1/audit/*` | audit.routes.ts |
| FR-OPS-001–002 | `/api/v1/operations/*` | operations.routes.ts |
| FR-ACT-001 | `/api/v1/activity/timeline` | activity.routes.ts |
| FR-SRC-001 | `/api/v1/search/` | search.routes.ts |
| FR-NOT-001–002 | `/api/v1/notifications/*` | notification.routes.ts |
| FR-SUP-001–002 | `/api/v1/support/*` | support.routes.ts |
| FR-SET-001–004 | `/api/v1/settings/*` | settings.routes.ts |
| FR-SYS-001 | `/api/live`, `/api/ready`, `/api/v1/system/health` | app.ts, system.routes.ts |
| FR-SYS-002 | POST `/api/v1/ai/chat` | ai.routes.ts |
| FR-USR-001–003 | `/api/v1/users/*`, `/api/v1/roles/*`, `/api/v1/permissions/` | user/role/permission routes |
| FR-SETT-001 | `/api/v1/settlements/*` | settlement.routes.ts |
| FR-PAYT-001–002 | `/api/v1/payouts/*` | payout.routes.ts |
| FR-REC-001 | `/api/v1/reconciliation/*` | reconciliation.routes.ts |

**Full endpoint list:** [API_Traceability.md](./API_Traceability.md) · [05_Repository_Audit/API_Inventory.md](../05_Repository_Audit/API_Inventory.md)

Per-endpoint middleware/DTO mapping: **NOT VERIFIED** exhaustive — see domain traceability docs.
