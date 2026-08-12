# Repository Governance

> **Enterprise Governance** · v1.0.0-rc1 · Section 6 · Generated 2026-08-03

---


| Policy | Implementation | Evidence | Verification |
| --- | --- | --- | --- |
| Ownership | Monorepo — Merchant Pro | README / CHANGELOG | VERIFIED |
| Branch strategy | main, master, develop CI triggers | .github/workflows/ci.yml | VERIFIED |
| Merge rules | PR to main/master/develop | .github/workflows/ci.yml on pull_request | VERIFIED |
| Release rules | Semantic versioning rc1 | CHANGELOG.md [1.0.0-rc1] | VERIFIED |
| Change management | CHANGELOG + RELEASE_NOTES | CHANGELOG.md | VERIFIED |
| Repository health | AST analyzers + knowledge graph | backend-analysis/, frontend-analysis/ | VERIFIED |
| Technical debt | See Technical_Debt_Register.md | docs/07_Governance/Technical_Debt_Register.md | VERIFIED |


