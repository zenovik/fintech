# Changelog

All notable changes for the Merchant Management Portal (Fintech Application).

## [1.0.0-rc1] — 2026-07-29

### Release Candidate — Production Readiness

First release candidate certifying V1 implementation complete.

#### Platform

- Express backend with 40+ API modules, organization-scoped RBAC, audit logging
- Angular 19 SPA with Material UI, executive dashboard, AI assistant
- MySQL 8 schema with enterprise seed data
- Redis-backed workers (webhooks, background jobs) with in-memory fallback
- Docker Compose production stack (mysql, redis, backend, worker, frontend)

#### Quality Gates

- **101/101** backend integration tests passing
- **75** Playwright E2E tests (CI-gated)
- k6 performance suite (smoke, load, stress, spike, soak profiles)
- OWASP security hardening: CSRF, JWT HS256 pinning, Zod validation, rate limits

#### Security (V1 Sprint)

- Double-submit CSRF for cookie-authenticated requests
- Permissions-Policy and nginx security headers
- Forgot-password rate limiting
- Webhook and developer portal input validation
- MySQL error sanitization in production responses

#### Fixes (RC1 Domain Sprint)

- Password reset / checkout session timezone expiry
- Merchant org isolation, refund math guards
- Webhook replay status, QR async completion
- Integration test harness stability

---

## [0.1.0] — Pre-RC

Initial monorepo scaffold: frontend, backend, database, CI pipelines.
