# Compliance Matrix

> **Enterprise Governance** · v1.0.0-rc1 · Section 16 · Generated 2026-08-03

---


## Security Compliance Matrix

| Control ID | Control | Framework | Evidence | Verification |
| --- | --- | --- | --- | --- |
| V2.1 | Authentication — JWT + session | OWASP ASVS | Backend_Fintech/src/app/modules/auth/middleware/auth.middleware.ts | VERIFIED |
| V4.1 | Access control — RBAC authorize() | OWASP ASVS | Backend_Fintech/src/app/shared/middleware/authorize.middleware.ts | VERIFIED |
| A01 | Broken Access Control | OWASP Top 10 | PERMISSIONS + authorize middleware | PARTIAL |
| A02 | Cryptographic Failures | OWASP Top 10 | bcryptjs + CONFIG_ENCRYPTION_KEY | VERIFIED |
| A03 | Injection | OWASP Top 10 | Parameterized mysql2 queries + Zod validation | VERIFIED |
| A05 | Security Misconfiguration | OWASP Top 10 | Helmet + CORS + CSP config | VERIFIED |
| A07 | Identification and Authentication Failures | OWASP Top 10 | MFA + auth routes | VERIFIED |
| CSRF | Cross-Site Request Forgery | CWE-352 | csrf.middleware.ts + FE interceptor | VERIFIED |
| CWE-798 | Hard-coded Credentials | CWE | env vars via dotenv — no secrets in repo | VERIFIED |
| PCI 3.4 | Render PAN unreadable | PCI DSS | NOT VERIFIED — no PCI scope doc in repo | NOT VERIFIED |
| SOC2 CC6.1 | Logical access controls | SOC2 | RBAC + audit logs | PARTIAL |
| ISO A.9 | Access control | ISO27001 | Authorization architecture docs + code | PARTIAL |
| T1078 | Valid Accounts | MITRE ATT&CK | JWT + MFA + session revocation | VERIFIED |



## Architecture Compliance Matrix

| Document | Status | Location |
| --- | --- | --- |
| Architecture_Overview.md | VERIFIED | docs/02_Architecture/Architecture_Overview.md |
| Security_Architecture.md | VERIFIED | docs/02_Architecture/Security_Architecture.md |
| Authentication_Architecture.md | VERIFIED | docs/02_Architecture/Authentication_Architecture.md |
| Payment_Architecture.md | VERIFIED | docs/02_Architecture/Payment_Architecture.md |
| Worker_Architecture.md | VERIFIED | docs/02_Architecture/Worker_Architecture.md |
| CI/CD Pipeline Architecture | NOT VERIFIED | docs/06_Code_Traceability/Implementation_Gaps.md#43 |
| Multi-region DR implementation | PARTIAL | docs/02_Architecture/Disaster_Recovery.md |
| Event outbox pattern | NOT VERIFIED | docs/06_Code_Traceability/Implementation_Gaps.md#73 |
| Backend AST call graph | VERIFIED | backend-analysis/output/json/backend-callgraph.json |
| Frontend AST call graph | VERIFIED | frontend-analysis/output/json/frontend-api-callgraph.json |



## Repository Compliance Matrix

| Metric | Value | Evidence | Verification |
| --- | --- | --- | --- |
| Endpoints discovered | 552 | backend-analysis/output/json/run-summary.json | VERIFIED |
| FE→API verified mappings | 1742 | frontend-analysis/output/json/run-summary.json | VERIFIED |
| SQL statements parsed | 877 | backend-analysis/output/json/repository-sql-map.json | VERIFIED |
| PCI-DSS compliance | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| SOC2 Type II | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |
| ISO27001 certification | NOT VERIFIED | NOT VERIFIED | NOT VERIFIED |


