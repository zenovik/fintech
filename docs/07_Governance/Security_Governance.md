# Security Governance

> **Enterprise Governance** · v1.0.0-rc1 · Section 4 · Generated 2026-08-03

---


## Control Mapping

| Control ID | Control | Framework | Repository File | Verification | Risk | Owner | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| V2.1 | Authentication — JWT + session | OWASP ASVS | Backend_Fintech/src/app/modules/auth/middleware/auth.middleware.ts | VERIFIED | Low | Security | Maintain session idle timeout |
| V4.1 | Access control — RBAC authorize() | OWASP ASVS | Backend_Fintech/src/app/shared/middleware/authorize.middleware.ts | VERIFIED | Low | Security | Complete permission matrix |
| A01 | Broken Access Control | OWASP Top 10 | PERMISSIONS + authorize middleware | PARTIAL | Medium | Security | Per-endpoint matrix NOT VERIFIED exhaustive |
| A02 | Cryptographic Failures | OWASP Top 10 | bcryptjs + CONFIG_ENCRYPTION_KEY | VERIFIED | Low | Security | Key rotation policy NOT VERIFIED |
| A03 | Injection | OWASP Top 10 | Parameterized mysql2 queries + Zod validation | VERIFIED | Low | Backend | Maintain parameterized SQL |
| A05 | Security Misconfiguration | OWASP Top 10 | Helmet + CORS + CSP config | VERIFIED | Low | DevOps | Production CSP review |
| A07 | Identification and Authentication Failures | OWASP Top 10 | MFA + auth routes | VERIFIED | Low | Security | Session concurrent limit NOT VERIFIED |
| CSRF | Cross-Site Request Forgery | CWE-352 | csrf.middleware.ts + FE interceptor | VERIFIED | Low | Security | Monitor CSRF_INVALID logs |
| CWE-798 | Hard-coded Credentials | CWE | env vars via dotenv — no secrets in repo | VERIFIED | Low | DevOps | Secrets manager NOT VERIFIED production |
| PCI 3.4 | Render PAN unreadable | PCI DSS | NOT VERIFIED — no PCI scope doc in repo | NOT VERIFIED | High | Compliance | External PCI assessment required |
| SOC2 CC6.1 | Logical access controls | SOC2 | RBAC + audit logs | PARTIAL | Medium | Compliance | Formal SOC2 audit NOT VERIFIED |
| ISO A.9 | Access control | ISO27001 | Authorization architecture docs + code | PARTIAL | Medium | Compliance | ISO certification NOT VERIFIED |
| T1078 | Valid Accounts | MITRE ATT&CK | JWT + MFA + session revocation | VERIFIED | Low | Security | Monitor failed login rates |



## Security Tooling Evidence

| Tool | Location | Verification |
| --- | --- | --- |
| Dependency audit | security/reports/dependency-audit.json | VERIFIED |
| ZAP baseline script | security/scripts/run-zap.mjs | VERIFIED |
| Live ZAP reports | security/reports/zap-*.json | NOT VERIFIED |
| Security CI workflow | .github/workflows/security.yml | VERIFIED (non-blocking) |
| Security unit tests | Backend_Fintech/src/__tests__/security-hardening.test.ts | VERIFIED |


