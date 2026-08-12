# Dead Feature Analysis

> **Phase 2 — Code Traceability** · v1.0.0-rc1 · 2026-07-29

---

| Feature / artifact | Backend | Frontend | Tests | Doc | Verdict |
|--------------------|---------|----------|-------|-----|---------|
| permissions UI | API exists | service only, no routes | authorization.integration | Authorization module | **Dead UI** |
| accounting | 4 endpoints | **NOT FOUND** feature | **NOT VERIFIED** | **MISSING** | **Backend-only** |
| pricing | 3 endpoints | **NOT FOUND** feature | **NOT VERIFIED** | **MISSING** | **Backend-only** |
| merchants empty folder | N/A | empty dir | N/A | N/A | **Dead structure** |
| payment-config | API exists | via settings **NOT VERIFIED** | **NOT VERIFIED** | partial | **Partial** |
| smart-collect | API + FE dashboard | yes | **NOT VERIFIED** int | **MISSING** product module | **Live partial** |
| excluded seed SQL 23–25 | N/A | N/A | N/A | N/A | **Orphan scripts** |

## Backend routes without FE feature folder

accounting, pricing, payment-config (partial)

## FE folders without backend gap

features/merchants (empty — merchant/ used instead)

## Confidence

High for empty folders and accounting/pricing FE gap; Medium for API usage without static call graph.

## Cross References

- [05_Repository_Audit/Dead_Code_Inventory.md](../05_Repository_Audit/Dead_Code_Inventory.md)
- [Implementation_Gaps.md](./Implementation_Gaps.md)
