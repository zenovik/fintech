# Security Traceability

> **Phase 2 — Code Traceability** · v1.0.0-rc1 · 2026-07-29

---

| Control | Implementation file | Config | Audit/log |
|---------|---------------------|--------|-----------|
| JWT access | token.service.ts | JWT_SECRET, JWT_EXPIRES_IN | auth failures logged |
| JWT refresh rotation | refresh-token.repository.ts | JWT_REFRESH_SECRET | session revoke |
| Password hash | password.service.ts | BCRYPT_ROUNDS | login_attempts |
| MFA OTP | auth.service.ts + otp.repository | OTP_* env | audit |
| CSRF | csrf.middleware.ts | cookie + header | 403 response |
| RBAC | authorize.middleware.ts | permissions.ts (144) | 403 response |
| Org isolation | organization.middleware.ts | x-organization-id / JWT | cross-org blocked |
| Rate limit global | global-rate-limit.middleware.ts | express-rate-limit | 429 |
| Rate limit API | buildApiRateLimitMiddleware | per-minute | 429 |
| Rate limit AI | ai-rate-limit.middleware.ts | AI_RATE_LIMIT_PER_MINUTE | audit |
| Helmet/CSP | http-security.ts | CSP_* env | headers |
| CORS | http-security.ts | CORS_ORIGIN | — |
| Zod validation | module dto/*.ts | schemas | 400 via error-handler |
| Config encryption | platform-config.service.ts | CONFIG_ENCRYPTION_KEY | — |
| Secrets in env | env.ts | .env | validate-env.ts prod |
| Security tests | security-hardening.test.ts | — | unit |
| ZAP DAST | security/scripts/run-zap.mjs | workflow_dispatch | reports/ |

## FR/BR mapping

FR-AUTH-*, FR-RBAC-* → above chain. BR-AUTH-001–014, BR-RBAC-001–006 → **Partial** line verification.

## Cross References

- [Authentication_Traceability.md](./Authentication_Traceability.md)
- [Authorization_Traceability.md](./Authorization_Traceability.md)
- [SECURITY.md](../../SECURITY.md)
