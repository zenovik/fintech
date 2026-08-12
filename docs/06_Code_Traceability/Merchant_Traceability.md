# Merchant Traceability

> **Phase 2 — Code Traceability** · v1.0.0-rc1 · 2026-07-29

---

## Chain (FR-MER-001 → FR-MER-006)

| Concern | Backend | Frontend | Tables |
|---------|---------|----------|--------|
| Merchant CRUD | merchant/ | merchant/ | merchants |
| Org isolation | organization.middleware + merchant.repository filters | organization-context | organization_id FK |
| Onboarding | merchant-onboarding/ | merchant-onboarding/ | merchant_onboarding_applications |
| Approval | onboarding-approval/ | onboarding-approval/ | workflow tables **NOT VERIFIED** names |
| Outlets | outlets/ | outlets/ | outlets |
| Merchant users | merchant-users/ | merchant-users/ | merchant_users |
| Documents | POST merchants/:id/documents | merchant pages | merchant_documents |

## Tests

merchants.integration.test.ts, e2e/merchants.spec.ts — onboarding approval **NOT VERIFIED** E2E.

## Docs

Merchant_Management.md, Merchant_Users.md, Organization_Management.md — Merchant Onboarding deep dive **MISSING**.

## Cross References

- [Business_to_Code_Matrix.md](./Business_to_Code_Matrix.md)
