# Architecture Governance

> **Enterprise Governance** · v1.0.0-rc1 · Section 3 · Generated 2026-08-03

---


## Architecture Document Verification

| Document / Claim | Status | Repository Location | Owner | Risk |
| --- | --- | --- | --- | --- |
| Architecture_Overview.md | VERIFIED | docs/02_Architecture/Architecture_Overview.md | Architecture | Low |
| Security_Architecture.md | VERIFIED | docs/02_Architecture/Security_Architecture.md | Architecture | Low |
| Authentication_Architecture.md | VERIFIED | docs/02_Architecture/Authentication_Architecture.md | Architecture | Low |
| Payment_Architecture.md | VERIFIED | docs/02_Architecture/Payment_Architecture.md | Architecture | Low |
| Worker_Architecture.md | VERIFIED | docs/02_Architecture/Worker_Architecture.md | Architecture | Low |
| CI/CD Pipeline Architecture | NOT VERIFIED | docs/06_Code_Traceability/Implementation_Gaps.md#43 | Architecture | Medium |
| Multi-region DR implementation | PARTIAL | docs/02_Architecture/Disaster_Recovery.md | Architecture | Medium |
| Event outbox pattern | NOT VERIFIED | docs/06_Code_Traceability/Implementation_Gaps.md#73 | Architecture | Medium |
| Backend AST call graph | VERIFIED | backend-analysis/output/json/backend-callgraph.json | Architecture | Low |
| Frontend AST call graph | VERIFIED | frontend-analysis/output/json/frontend-api-callgraph.json | Architecture | Low |



## AST Evidence Summary

| Analyzer | Metric | Evidence | Verification |
| --- | --- | --- | --- |
| Backend AST V2 | 552 endpoints | backend-analysis/output/json/run-summary.json | VERIFIED |
| Frontend AST V2 | 1742 verified FE→API mappings | frontend-analysis/output/json/run-summary.json | VERIFIED |
| Knowledge Graph | 9780 nodes | engineering-knowledge/json/run-summary.json | VERIFIED |


