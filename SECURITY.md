# Security — v1.0.0-rc1

Production security controls for the Merchant Management Portal.

> Detailed backend guide: [Backend_Fintech/docs/SECURITY.md](./Backend_Fintech/docs/SECURITY.md)

## Authentication

| Control | Implementation |
|---------|----------------|
| Access token | HttpOnly cookie (`/api`) or Bearer header |
| Refresh token | HttpOnly cookie (`/api/auth`), rotation on refresh |
| JWT algorithm | HS256 only (pinned sign/verify) |
| MFA | TOTP OTP optional per user |
| Session idle | Configurable (`SESSION_IDLE_MINUTES`, default 15) |
| Password policy | Min 8 chars, uppercase, number/special |

## CSRF

- `GET /api/auth/csrf-token` issues double-submit cookie
- State-changing cookie requests require `X-CSRF-Token` header
- Bearer-authenticated API clients exempt

## Authorization

- RBAC with 69 permissions, super-admin bypass
- Organization-scoped queries via middleware + repository filters
- Horizontal privilege escalation blocked (integration verified)

## HTTP Headers

| Header | API (Helmet) | SPA (nginx) |
|--------|--------------|-------------|
| Content-Security-Policy | Yes (prod) | Yes |
| Strict-Transport-Security | Prod only | Via reverse proxy |
| X-Content-Type-Options | nosniff | nosniff |
| X-Frame-Options | DENY | DENY |
| Referrer-Policy | strict-origin-when-cross-origin | Yes |
| Permissions-Policy | camera/mic/geo disabled | Yes |

## Rate Limiting

- Global: 2000 req/15min (prod)
- API: 300 req/min
- Auth login: 20/15min, OTP: 30/15min, forgot-password: 10/15min

## Logging & PII

- Structured logs via `pii-mask.helper.ts` — passwords, tokens, PAN masked
- Production errors never expose stack traces or SQL

## Certification (29 Jul 2026)

| Check | Result |
|-------|--------|
| Critical findings | 0 |
| High findings | 0 |
| CSRF | Implemented |
| JWT pinning | Implemented |
| ZAP baseline | CI-ready (Docker required locally) |
| Backend npm audit critical | 0 |

## Reports

- `security/reports/dependency-audit.json`
- `security/reports/false-positives.md`
- `security/reports/remediation-report.md`

Run: `npm run security:audit` · `npm run security:zap`
