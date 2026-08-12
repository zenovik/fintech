# Requirements to Documentation

> **Phase 2 — Code Traceability** · v1.0.0-rc1 · 2026-07-29

---

| FR domain | Product FR doc | Module deep dive | Architecture doc | Verified accurate |
|-----------|----------------|------------------|------------------|-------------------|
| FR-AUTH-* | Functional_Requirements.md §Auth | Modules/Authentication.md | Authentication_Architecture.md | **Yes** |
| FR-RBAC-* | Functional_Requirements.md §RBAC | Modules/Authorization.md | Authorization_Architecture.md | **Yes** |
| FR-PAY-* | §Payments | Modules/Payments.md, Payment_Lifecycle.md | Payment_Architecture.md | **Yes** |
| FR-CHK-* | §Checkout | Modules/Checkout.md | Payment_Architecture.md (partial) | **Yes** |
| FR-WH-* | §Webhooks | Modules/Webhooks.md | Webhook_Architecture.md | **Yes** |
| FR-MER-* | §Merchants | Merchant_Management.md | Integration_Architecture.md | **Yes** |
| FR-SETT-*, FR-PAYT-* | §Settlements/Payouts | **MISSING** module deep dive | **NOT VERIFIED** dedicated arch | **Partial** |
| FR-REC-* | §Reconciliation | **MISSING** | **NOT VERIFIED** | **Partial** |
| FR-SUP-* | §Support | **MISSING** | **NOT VERIFIED** | **Partial** |
| NFR-* | Non_Functional_Requirements.md (42) | Assumptions_and_Constraints.md | Scalability/Security arch docs | **Partial** |

## Business Rules → Documentation

52 BRs in [Business_Rules.md](../01_Product/Business_Rules.md) — each cites implementation area (e.g., "Auth service", "CSRF middleware"). Code verification: **NOT VERIFIED** line-by-line for all 52.

## Documentation Gaps (requirements without module deep dive)

Transactions, Settlements, Payouts, Customers, Fraud, Smart Collect, Reconciliation, Support, AI, Merchant Onboarding — FRs exist; module docs **MISSING**.

## Cross References

- [Documentation_Verification.md](./Documentation_Verification.md)
