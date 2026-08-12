# Data Governance

> **Enterprise Governance** · v1.0.0-rc1 · Section 5 · Generated 2026-08-03

---


| Domain | Implementation | Evidence | Verification | Owner |
| --- | --- | --- | --- | --- |
| PII | User profiles, customer data in MySQL | docs/03_Database/Data_Dictionary.md | PARTIAL | DBA |
| Secrets | Environment variables; CONFIG_ENCRYPTION_KEY | Backend_Fintech/src/app/config/ | VERIFIED | DevOps |
| Encryption at rest | CONFIG_ENCRYPTION_KEY for sensitive settings | docs/02_Architecture/Security_Architecture.md | PARTIAL | Security |
| Encryption in transit | HTTPS/TLS assumed at deployment | NOT VERIFIED in repo config | NOT VERIFIED | DevOps |
| Key rotation | NOT VERIFIED automated rotation | NOT VERIFIED | NOT VERIFIED | Security |
| Retention | export-registry, audit tables | docs/06_Code_Traceability/Implementation_Gaps.md#83 | NOT VERIFIED |
| Deletion | Soft delete (deleted_at) on 76 table refs | docs/05_Repository_Audit/Repository_Statistics.md | PARTIAL | DBA |
| Audit | auditRecorder + audit_logs table | backend-analysis audit-map.json (227 mappings) | VERIFIED | Security |
| Recovery | Database_Fintech/docs + Recovery_Strategy.md | docs/03_Database/Recovery_Strategy.md | PARTIAL | DBA |
| Backups | NOT VERIFIED automated backup scripts | NOT VERIFIED | NOT VERIFIED | Operations |
| Masking | request-logging sensitive route masks | docs/05_Repository_Audit/Repository_Risk_Register.md#R-14 | PARTIAL | Security |
| Classification | NOT VERIFIED formal data classification register | NOT VERIFIED | NOT VERIFIED | Compliance |


