# Database Traceability

> **Phase 2 — Code Traceability** · v1.0.0-rc1 · 2026-07-29

---

## Schema Facts

| Metric | Value | Source |
|--------|------:|--------|
| Tables | 223 | master_database.sql |
| Stored procedures | 5 | demo seed procedures |
| Views | 0 | no CREATE VIEW |
| deleted_at references | 76 | grep master SQL |

## Major Table Traceability

| Table | Purpose | Repository | API (sample) | Worker | PII | Product doc |
|-------|---------|------------|--------------|--------|-----|-------------|
| users | Identity | user.repository (auth) | /api/v1/users, /api/auth | — | HIGH | Authentication |
| organizations | Tenant | organization.repository | /api/v1/organizations | — | MEDIUM | Organization_Management |
| merchants | Merchant entity | merchant.repository | /api/v1/merchants | — | MEDIUM | Merchant_Management |
| payment_intents | Payment state | payment.repository | /api/v1/payments | webhook enqueue | LOW | Payments |
| checkout_sessions | Hosted checkout | checkout.repository | /api/v1/checkout, public | — | HIGH | Checkout |
| refunds | Refunds | refund.repository | /api/v1/refunds | webhook | — | Refunds |
| chargebacks | Disputes | chargeback.repository | /api/v1/chargebacks | notification | — | Chargebacks |
| background_jobs | Async queue | background-job.service | /api/v1/operations/jobs | worker claims | context | Workers |
| retry_queue | Retries | operations.repository | /api/v1/operations/retry-queue | worker | — | Background_Jobs |
| webhook_delivery_queue | Outbound WH | webhooks.repository | /api/v1/webhooks/deliveries | worker | — | Webhooks |
| audit_logs | Compliance | audit.repository | /api/v1/audit | — | MEDIUM | Audit |
| feature_flags | Toggles | platform-config.repository | /api/v1/settings/feature-flags | middleware | — | Feature_Flags |
| notifications | In-app | notification.repository | /api/v1/notifications | email worker | — | Notifications |
| refresh_tokens | Sessions | refresh-token.repository | /api/auth/refresh | — | hash only | Authentication |

**Remaining ~209 tables:** **NOT VERIFIED** per-table traceability in Phase 2.

## Build → Deploy Trace

`structure_queries/` → `build-master.ps1` → `master_database.sql` → Docker init + CI import

## Cross References

- [03_Database/ERD.md](../03_Database/ERD.md)
- [Requirements_to_Database.md](./Requirements_to_Database.md)
