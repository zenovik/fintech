# Technical Debt Register

> **Enterprise Governance** · v1.0.0-rc1 · Section 15 · Generated 2026-08-03

---


| ID | Item | Priority | Estimate | Owner | Recommendation | Evidence | Verification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TD-01 | Per-endpoint authorize() permission matrix incomplete | High | M | Security | Automated grep/AST matrix | docs/06_Code_Traceability/Implementation_Gaps.md#2 | VERIFIED |
| TD-02 | 209+ tables without per-table traceability doc | High | L | DBA | Extend table dictionary | docs/06_Code_Traceability/Implementation_Gaps.md#3 | VERIFIED |
| TD-03 | accounting/pricing APIs without frontend feature | Medium | M | Product | Build UI or deprecate APIs | docs/06_Code_Traceability/Implementation_Gaps.md#4 | VERIFIED |
| TD-04 | Multiple modules lack integration tests | High | L | QA | Add integration test files | docs/06_Code_Traceability/Implementation_Gaps.md#7-24 | VERIFIED |
| TD-05 | Multiple modules lack Playwright E2E specs | Medium | L | QA | Expand e2e/ coverage | docs/06_Code_Traceability/Implementation_Gaps.md#25-32 | VERIFIED |
| TD-06 | Missing product module docs (10+ modules) | Medium | M | Product | Complete docs/01_Product/Modules/ | docs/06_Code_Traceability/Implementation_Gaps.md#33-42 | VERIFIED |
| TD-07 | CI/CD architecture document absent | Low | S | DevOps | Add to docs/02_Architecture/ | docs/06_Code_Traceability/Implementation_Gaps.md#43 | VERIFIED |
| TD-08 | OpenAPI static export artifact absent | Low | S | Backend | Export /api/docs.json in CI | docs/06_Code_Traceability/Implementation_Gaps.md#45 | VERIFIED |
| TD-09 | Frontend Karma unit tests NOT VERIFIED | Low | M | Frontend | Confirm *.spec.ts existence | docs/06_Code_Traceability/Implementation_Gaps.md#50 | NOT VERIFIED |
| TD-10 | Full rollback scripts for 223 tables partial (7 only) | Medium | L | DBA | Expand rollback coverage | docs/06_Code_Traceability/Implementation_Gaps.md#66 | VERIFIED |
| TD-11 | Duplicate documentation locations | Low | S | Engineering | Cross-ref policy enforcement | docs/05_Repository_Audit/Repository_Risk_Register.md#R-09 | VERIFIED |
| TD-12 | 183 backend DI graph false-positive violations | Low | M | Backend | Improve AST DI resolver | backend-analysis/output/validation/validation-report.json | VERIFIED |


