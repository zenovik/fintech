# Security Inventory

> **Phase 1 — Repository Audit** · v1.0.0-rc1 · Evidence from implementation · 2026-07-29

---

## Authentication

| Control | Implementation | File |
|---------|----------------|------|
| JWT access tokens | HS256, pinned algorithm | token.service.ts |
| Refresh tokens | SHA-256 hash in DB, rotation | refresh-token.repository.ts |
| Session tracking | user_sessions table | session.repository.ts |
| MFA/OTP | otplib | auth.service.ts |
| Login lockout | MAX_LOGIN_ATTEMPTS | env + login-attempt.repository |
| Password policy | settings + bcrypt rounds | password.service.ts |
| Trusted devices | trusted_device.repository | auth module |

## Authorization

| Control | Implementation |
|---------|----------------|
| RBAC | 144 permissions, authorize() middleware |
| Org isolation | organization.middleware.ts |
| Merchant scope | merchant.middleware.ts |

## Transport & Headers

| Control | Implementation |
|---------|----------------|
| Helmet | http-security.ts |
| CORS | env CORS_ORIGIN |
| CSP | CSP_* env vars |
| Compression | compression middleware |
| Permissions-Policy | http-security.ts |

## CSRF

| Control | Implementation |
|---------|----------------|
| CSRF tokens | csrf.middleware.ts |
| GET /api/auth/csrf-token | auth.routes.ts |
| Frontend interceptor | csrf.service.ts, auth.interceptor.ts |

## Rate Limiting

| Limiter | Scope |
|---------|-------|
| Global 15-min | /api/v1 |
| Per-minute API | /api/v1 |
| AI per-minute | /api/v1/ai |
| Forgot-password | auth.routes.ts |

## Input Validation

| Tool | Scope |
|------|-------|
| Zod | DTOs, webhooks, developer routes |
| MySQL error sanitization | error-handler.middleware.ts |

## Secrets

| Secret | Storage |
|--------|---------|
| JWT secrets | Environment |
| DB password | Environment |
| CONFIG_ENCRYPTION_KEY | Environment (required prod) |
| API keys | organization_api_keys table (hashed) |

## Security Testing

| Tool | Location |
|------|----------|
| OWASP ZAP | security/scripts/run-zap.mjs |
| npm audit wrapper | security/scripts/audit-deps.mjs |
| security-hardening.test.ts | Unit tests |
| CI workflow | .github/workflows/security.yml |

## Security Documentation

| Doc | Path |
|-----|------|
| SECURITY.md | repo root |
| Backend security | Backend_Fintech/docs/SECURITY.md |
| Remediation reports | security/reports/ |

## NOT VERIFIED

| Item | Status |
|------|--------|
| PCI-DSS compliance | **NOT VERIFIED** |
| Pen test results | **NOT VERIFIED** |
| SAST beyond ESLint | **NOT FOUND** |

## Cross References

- [02_Architecture/Security_Architecture.md](../02_Architecture/Security_Architecture.md)
- [04_Solution_Design/Security_Model.md](../04_Solution_Design/Security_Model.md)
