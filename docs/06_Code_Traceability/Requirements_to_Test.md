# Requirements to Test

> **Phase 2 — Code Traceability** · v1.0.0-rc1 · 2026-07-29

---

**Source:** 78 FRs in [Functional_Requirements.md](../01_Product/Functional_Requirements.md)

## Test Asset Inventory

| Type | Count | Location |
|------|------:|----------|
| Backend integration | 17 | `Backend_Fintech/src/__tests__/integration/*.integration.test.ts` |
| Backend unit | 3 | `Backend_Fintech/src/__tests__/*.test.ts` |
| E2E Playwright | 16 specs | `e2e/tests/*.spec.ts` |
| k6 performance | 5 profiles | `performance/` via workflow_dispatch |
| Security | ZAP + audit | `security/scripts/`, `security-hardening.test.ts` |

## FR → Test Mapping

| FR domain | Integration test file | E2E spec | Verified |
|-----------|----------------------|----------|----------|
| FR-AUTH-* | auth.integration.test.ts | auth.spec.ts | **Yes** |
| FR-RBAC-* | authorization.integration.test.ts | rbac.spec.ts | **Yes** |
| FR-MER-* | merchants.integration.test.ts | merchants.spec.ts | **Yes** |
| FR-PAY-* | payments.integration.test.ts, payment-transactions.integration.test.ts | payments.spec.ts | **Yes** |
| FR-CHK-* | checkout.integration.test.ts | checkout.spec.ts | **Yes** |
| FR-PL-*, FR-QR-* | qr-payment-links.integration.test.ts | payment-links.spec.ts, qr-payments.spec.ts | **Yes** |
| FR-REF-*, FR-CB-* | chargebacks-refunds.integration.test.ts | chargebacks.spec.ts | **Partial** — refunds E2E **NOT VERIFIED** |
| FR-SUB-*, FR-INV-* | subscriptions-invoices.integration.test.ts | subscriptions.spec.ts | **Partial** — invoices E2E **NOT VERIFIED** |
| FR-WH-* | webhooks-workers.integration.test.ts | webhooks.spec.ts | **Yes** |
| FR-DEV-*, FR-SBX-* | developer-sandbox.integration.test.ts | developer-settings.spec.ts, sandbox **NOT VERIFIED** | **Partial** |
| FR-RPT-*, FR-AUD-* | reports-audit.integration.test.ts | audit.spec.ts, reports.spec.ts | **Yes** |
| FR-NOT-* | notifications.integration.test.ts | **NOT VERIFIED** | **Partial** |
| FR-OPS-*, FR-ACT-*, FR-SRC-* | **NOT VERIFIED** dedicated integration | **NOT VERIFIED** E2E | **NOT VERIFIED** |
| FR-SUP-* | **NOT VERIFIED** | **NOT VERIFIED** | **NOT VERIFIED** |
| FR-SET-*, FR-SYS-* | negative.integration.test.ts (partial) | errors.spec.ts | **Partial** |
| FR-USR-* | users.integration.test.ts | users.spec.ts | **Yes** |
| FR-SETT-*, FR-PAYT-*, FR-REC-* | **NOT VERIFIED** | **NOT VERIFIED** | **NOT VERIFIED** |

## NFR → Test Mapping

| NFR area | Test evidence | Status |
|----------|---------------|--------|
| Concurrency | concurrency.integration.test.ts | Verified |
| Database integrity | database.integration.test.ts | Verified |
| Negative paths | negative.integration.test.ts | Verified |
| Performance | performance.yml + k6 | CI manual only |
| Security OWASP | security.yml + ZAP | CI manual only |

## Coverage Gap

~28 FR domains lack dedicated integration **and** E2E coverage — see [Implementation_Gaps.md](./Implementation_Gaps.md).
