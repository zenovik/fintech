# Database Governance

> **Enterprise Governance** · v1.0.0-rc1 · Section 8 · Generated 2026-08-03

---


| Standard | Implementation | Evidence | Verification |
| --- | --- | --- | --- |
| Naming | snake_case tables/columns | docs/03_Database/Naming_Standards.md | VERIFIED |
| Indexes | Documented in Indexes.md | docs/03_Database/Indexes.md | VERIFIED |
| Foreign keys | Constraints.md | docs/03_Database/Constraints.md | VERIFIED |
| Transactions | Manual beginTransaction/commit/rollback | 39 AST-discovered | VERIFIED |
| Migration | build-master.ps1 → master_database.sql | Database_Fintech/scripts/build-master.ps1 | VERIFIED |
| Rollback | 7 partial rollback scripts only | Implementation_Gaps.md #66 | PARTIAL |
| Partition | Partitioning_Strategy.md | docs/03_Database/Partitioning_Strategy.md | PARTIAL |
| Retention | NOT VERIFIED per-table policies | NOT VERIFIED | NOT VERIFIED |
| Backup | NOT VERIFIED in repository | NOT VERIFIED | NOT VERIFIED |
| Performance | Performance_Considerations.md | docs/03_Database/Performance_Considerations.md | VERIFIED |


