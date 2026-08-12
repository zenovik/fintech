# Security Handbook

> **Enterprise Delivery — Phase 8** · v1.0.0-rc1 · Section 9 · 2026-08-03

> Evidence-based handover documentation. Unsupported claims marked **NOT VERIFIED**.

---


Cross-ref: docs/07_Governance/Security_Governance.md, Backend_Fintech/docs/SECURITY.md

| Control | Implementation | Evidence |
| --- | --- | --- |
| Authentication | JWT + session + MFA | auth.middleware.ts |
| Authorization | RBAC 144 permissions | authorize.middleware.ts |
| CSRF | Double-submit cookie+header | csrf.middleware.ts |
| JWT | HS256 — JWT_SECRET env | .env.example |
| Cookies | httpOnly refresh cookie | auth routes |
| Redis | Locks, cache, rate limit helper | REDIS.md |
| Secrets | Environment variables | .env.example |
| Encryption | CONFIG_ENCRYPTION_KEY | Security_Architecture.md |
| Logging | Sensitive route masking | Risk_Register R-14 |
| Audit | auditRecorder → audit_logs | audit module |
| Threat model | docs/02_Architecture/Trust_Boundaries.md | VERIFIED |
| Known limitations | docs/07_Governance/Risk_Register.md | VERIFIED |



External PCI/SOC2/ISO: **NOT VERIFIED**
