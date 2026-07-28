# Known Limitations — v1.0.0-rc1

## Performance & Scale

- Rate limiting uses in-memory store when Redis unavailable; horizontal scaling requires Redis-backed limits
- k6 load/stress/soak profiles validated in CI only when k6 is installed
- Worker concurrency fixed via `WORKER_CONCURRENCY` env (default 5)

## Security

- CSP allows `unsafe-inline` for Angular Material styles (nonce-based CSP planned V2)
- HSTS preload disabled until production domain confirmed
- API keys in developer portal stored but not enforced on every API request (V2)
- Dev dependency CVEs in `@angular-devkit/build-angular` chain (build-time only)

## Platform

- SSO buttons (Google/GitHub) are UI placeholders — disabled
- Inbound webhook signature verification not applicable (outbound-only platform)
- File uploads store metadata; binary MIME validation limited
- Geo/IP restriction settings stored but not request-enforced

## Testing

- Local E2E requires full database seed (`npm run db:setup`) matching `e2e/data/users.ts`
- OWASP ZAP DAST requires Docker (`npm run security:zap`)
- k6 performance requires k6 binary (`npm run perf:smoke`)

## AI

- Requires `GEMINI_API_KEY` for AI features; graceful degradation when unset
- Rate limit 20 requests/minute per user
