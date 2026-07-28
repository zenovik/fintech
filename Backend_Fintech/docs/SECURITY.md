# Security Guide

Production security controls implemented in the Merchant Management Portal backend and frontend.

## HTTP Security Headers

Helmet is enabled on the API (`Backend_Fintech/src/app/config/http-security.ts`):

| Header | Behavior |
|--------|----------|
| Content-Security-Policy | Enabled when `CSP_ENABLED=true` (default). Disabled in development when `CSP_DEV_MODE=off`. |
| HSTS | Production only |
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | strict-origin-when-cross-origin |

The Angular SPA served by nginx also emits a CSP header (`Frontend_Fintech/nginx.conf`).

### CSP Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CSP_ENABLED` | `true` | Master switch for API Helmet CSP |
| `CSP_DEV_MODE` | `relaxed` | Set to `off` to disable CSP in non-production |
| `CSP_CONNECT_SRC_EXTRA` | empty | Comma-separated extra `connect-src` origins |
| `CSP_REPORT_URI` | empty | Optional CSP violation report URI |

Development CSP automatically allows `localhost:4200` and WebSocket HMR endpoints.

## Authentication Tokens

| Token | Storage | Path |
|-------|---------|------|
| Access token | HttpOnly cookie (`accessToken`) | `/api` |
| Refresh token | HttpOnly cookie (`refreshToken`) | `/api/auth` |

The backend accepts tokens from the HttpOnly cookie **or** the `Authorization: Bearer` header (backward compatible for API clients).

The Angular frontend does **not** store access tokens in `localStorage`. Session state uses:

- HttpOnly cookies for tokens (sent via `withCredentials`)
- `sessionStorage` for token expiry hint only
- `localStorage` for non-sensitive user profile cache

Configure cookie names via:

- `ACCESS_TOKEN_COOKIE_NAME` (default: `accessToken`)
- `REFRESH_TOKEN_COOKIE_NAME` (default: `refreshToken`)

## Rate Limiting

Global and API rate limits are applied in `global-rate-limit.middleware.ts`. Auth routes have dedicated limiters including login, OTP, forgot-password, and a route-wide auth cap.

## CSRF Protection

Cookie-authenticated browser sessions use double-submit CSRF tokens:

1. `GET /api/auth/csrf-token` issues a `csrfToken` cookie (readable by JS, SameSite=strict)
2. State-changing requests must include matching `X-CSRF-Token` header
3. Requests with `Authorization: Bearer` skip CSRF (machine/API clients)

The Angular `authInterceptor` fetches and attaches CSRF tokens automatically.

## Secrets & Encryption

- Production startup validates secrets via `validateProductionEnv()`
- SMTP and webhook secrets encrypted with AES-256-GCM (`secret-crypto.ts`)
- `CONFIG_ENCRYPTION_KEY` required in production

## PII Masking

Structured logs pass metadata through `maskSensitiveObject()` (`pii-mask.helper.ts`) before serialization.

## Audit Tenant Isolation

- Audit writes persist `organization_id` from request context
- Audit reads filter by `organization_id` when org context is present
- API and webhook log queries scoped to organization members / merchant webhook URLs

## Webhook Security

Outbound webhooks signed with HMAC-SHA256 (`X-Webhook-Signature` header).

## Redis & Worker Safety

- Redis auto-fallback to in-memory mode on connection failure
- Automatic recovery polling every 60 seconds
- Worker queue claiming uses `SELECT ... FOR UPDATE`
- Distributed locks via Redis when available

See also: [REDIS.md](./REDIS.md), [WORKER.md](./WORKER.md), [DEPLOYMENT.md](../../DEPLOYMENT.md).
