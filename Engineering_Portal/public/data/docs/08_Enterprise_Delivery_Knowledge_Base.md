# Knowledge Base

> **Enterprise Delivery — Phase 8** · v1.0.0-rc1 · Section 19 · 2026-08-03

> Evidence-based handover documentation. Unsupported claims marked **NOT VERIFIED**.

---



## FAQ Index (110 entries)

### Authentication

**Q: How do users log in?**

A: POST /api/auth/login with email/password. MFA via verify-otp if enabled.

Evidence: `Backend_Fintech/src/app/modules/auth/routes/auth.routes.ts` · Verification: **VERIFIED**

**Q: Where is JWT validated?**

A: auth.middleware.ts — Bearer header or access-token cookie.

Evidence: `Backend_Fintech/src/app/modules/auth/middleware/auth.middleware.ts` · Verification: **VERIFIED**

**Q: What cookie is used for refresh?**

A: Refresh token in httpOnly cookie with withCredentials on API calls.

Evidence: `Frontend_Fintech/src/app/core/auth/interceptors/auth.interceptor.ts` · Verification: **VERIFIED**

**Q: How is CSRF handled?**

A: Double-submit: X-CSRF-Token header on mutating requests when using cookies.

Evidence: `Backend_Fintech/src/app/shared/middleware/csrf.middleware.ts` · Verification: **VERIFIED**

**Q: Session idle timeout?**

A: SessionService monitors idle; settings from settings API — exact TTL **NOT VERIFIED** without runtime config.

Evidence: `Frontend_Fintech/src/app/core/auth/services/session.service.ts` · Verification: **PARTIAL**

**Q: Forgot password flow?**

A: POST /api/auth/forgot-password → email with reset link.

Evidence: `Backend_Fintech/docs/PASSWORD_RESET.md` · Verification: **VERIFIED**

**Q: MFA methods supported?**

A: TOTP and SMS per Security_Architecture.md.

Evidence: `docs/02_Architecture/Security_Architecture.md` · Verification: **VERIFIED**

**Q: What happens on 401?**

A: Auth interceptor attempts refresh; redirects to login on failure.

Evidence: `auth.interceptor.ts` · Verification: **VERIFIED**

**Q: Public auth routes?**

A: login, forgot-password, reset-password, verify-otp, resend-otp exempt from org headers.

Evidence: `auth.interceptor.ts` · Verification: **VERIFIED**

**Q: Concurrent session limit?**

A: session repository exists — enforcement **NOT VERIFIED** exhaustive.

Evidence: `Implementation_Gaps.md#89` · Verification: **NOT VERIFIED**

**Q: Password hashing algorithm?**

A: bcryptjs per package.json dependency.

Evidence: `Backend_Fintech/package.json` · Verification: **VERIFIED**

**Q: Access denied route?**

A: AUTH_ROUTES.ACCESS_DENIED — permission guard redirect.

Evidence: `permission.guard.ts` · Verification: **VERIFIED**

**Q: Organization selection required?**

A: X-Organization-Id header from localStorage after org select.

Evidence: `auth.interceptor.ts` · Verification: **VERIFIED**

**Q: Merchant context headers?**

A: X-Merchant-Id, X-Outlet-Id from localStorage.

Evidence: `auth.interceptor.ts` · Verification: **VERIFIED**

**Q: Guest routes?**

A: guest.guard.ts for unauthenticated-only pages.

Evidence: `Frontend_Fintech/src/app/core/auth/guards/guest.guard.ts` · Verification: **VERIFIED**

### HTTP Errors

**Q: Standard error shape?**

A: AppError hierarchy → error-handler.middleware structured JSON.

Evidence: `shared/exceptions/app.exception.ts` · Verification: **VERIFIED**

**Q: Validation error code?**

A: ValidationError from Zod safeParse failures.

Evidence: `shared/validators/zod-validator.ts` · Verification: **VERIFIED**

**Q: 404 handling?**

A: notFoundHandler middleware after all routes.

Evidence: `shared/middleware/not-found.middleware.ts` · Verification: **VERIFIED**

**Q: 429 rate limit?**

A: TooManyRequestsError + express-rate-limit middleware.

Evidence: `global-rate-limit.middleware.ts` · Verification: **VERIFIED**

**Q: 403 CSRF invalid?**

A: CSRF_INVALID code; frontend clears CSRF cache.

Evidence: `auth.interceptor.ts` · Verification: **VERIFIED**

**Q: API base URL?**

A: http://localhost:3000/api (dev); /api/v1 for resources.

Evidence: `environment.ts` · Verification: **VERIFIED**

**Q: Pagination params?**

A: page and pageSize query params — Zod schemas per module.

Evidence: `payment.dto.ts paymentListQuerySchema` · Verification: **VERIFIED**

**Q: Swagger location?**

A: /api/docs and /api/docs.json (non-production).

Evidence: `Backend_Fintech/src/app/swagger/` · Verification: **VERIFIED**

**Q: Health endpoints?**

A: /api/live, /api/ready, /api/health

Evidence: `Backend_Fintech/src/app/app.ts` · Verification: **VERIFIED**

**Q: Idempotency header?**

A: X-Idempotency-Key on payment create — payment.controller.ts

Evidence: `payment.controller.ts` · Verification: **VERIFIED**

**Q: Total API endpoints?**

A: 552 AST-discovered

Evidence: `backend-analysis/output/json/run-summary.json` · Verification: **VERIFIED**

**Q: API versioning?**

A: /api/v1/* and /api/auth/* prefixes.

Evidence: `app.ts` · Verification: **VERIFIED**

**Q: CORS origin config?**

A: CORS_ORIGIN env var.

Evidence: `.env.example` · Verification: **VERIFIED**

**Q: Production error sanitization?**

A: MySQL errors sanitized in production per CHANGELOG.

Evidence: `CHANGELOG.md` · Verification: **VERIFIED**

**Q: OpenAPI static export in repo?**

A: NOT VERIFIED — runtime docs only.

Evidence: `Implementation_Gaps.md#45` · Verification: **NOT VERIFIED**

### Payment Errors

**Q: Payment intent lifecycle?**

A: pending → authorized → captured → settled; refunds/chargebacks separate modules.

Evidence: `docs/01_Product/Modules/Payments.md` · Verification: **VERIFIED**

**Q: Create payment endpoint?**

A: POST /api/v1/payments

Evidence: `payment.routes.ts` · Verification: **VERIFIED**

**Q: Capture endpoint?**

A: POST /api/v1/payments/:id/capture

Evidence: `payment.routes.ts` · Verification: **VERIFIED**

**Q: Refund endpoint?**

A: POST /api/v1/payments/:id/refund

Evidence: `payment.routes.ts` · Verification: **VERIFIED**

**Q: Payment gateway vendor?**

A: Custom gateway layer — Stripe/Razorpay SDK **NOT VERIFIED**.

Evidence: `Repository_Risk_Register.md R-13` · Verification: **NOT VERIFIED**

**Q: Checkout public URL?**

A: /api/v1/public/checkout/* routes

Evidence: `checkout.routes.ts` · Verification: **VERIFIED**

**Q: Payment links?**

A: /api/v1/payment-links + public payment-links

Evidence: `payment-links module` · Verification: **VERIFIED**

**Q: QR payments?**

A: qr-payments module + public routes

Evidence: `qr-payments module` · Verification: **VERIFIED**

**Q: Webhook deliveries?**

A: payment_webhook_deliveries table; worker processes

Evidence: `WORKER.md` · Verification: **VERIFIED**

**Q: Idempotency storage?**

A: payment_idempotency_keys table referenced in payment-engine.service.ts

Evidence: `payment-engine.service.ts` · Verification: **VERIFIED**

**Q: Transaction boundaries?**

A: beginTransaction/commit/rollback in payment-engine.service.ts

Evidence: `backend-analysis transaction-map.json` · Verification: **VERIFIED**

**Q: Payment permissions?**

A: PERMISSIONS.PAYMENTS_READ/WRITE/CAPTURE/REFUND/MANAGE

Evidence: `payment.routes.ts` · Verification: **VERIFIED**

### Redis Errors

**Q: Redis required?**

A: Optional — REDIS_ENABLED=true; in-memory fallback when false.

Evidence: `Backend_Fintech/docs/REDIS.md` · Verification: **VERIFIED**

**Q: Redis URL config?**

A: REDIS_URL=redis://localhost:6379

Evidence: `.env.example` · Verification: **VERIFIED**

**Q: Worker locks?**

A: acquireLock/releaseLock in redis.client.ts

Evidence: `shared/infrastructure/redis.client.ts` · Verification: **VERIFIED**

**Q: Worker heartbeat key?**

A: worker:heartbeat (30s TTL per WORKER.md)

Evidence: `WORKER.md` · Verification: **VERIFIED**

**Q: Cache key prefix?**

A: cache: prefix in cacheGet/cacheSet

Evidence: `REDIS.md` · Verification: **VERIFIED**

**Q: Rate limit uses Redis?**

A: rateLimitCheck helper — store backend **NOT VERIFIED** exhaustive.

Evidence: `Implementation_Gaps.md#82` · Verification: **NOT VERIFIED**

**Q: Multi-worker without Redis?**

A: Single-process only; locks degrade to in-memory.

Evidence: `WORKER.md` · Verification: **VERIFIED**

**Q: Redis restart impact?**

A: Locks lost; workers may duplicate until TTL — see Redis_Failure runbook.

Evidence: `runbooks/Redis_Failure.md` · Verification: **PARTIAL**

**Q: Redis health check?**

A: health.service.ts checks Redis — **NOT VERIFIED** response shape.

Evidence: `modules/system/services/health.service.ts` · Verification: **PARTIAL**

**Q: Redis port in Docker?**

A: REDIS_PORT=6379

Evidence: `.env.example` · Verification: **VERIFIED**

### Worker Errors

**Q: How to start worker?**

A: npm run worker --workspace=Backend_Fintech

Evidence: `WORKER.md` · Verification: **VERIFIED**

**Q: Worker poll interval?**

A: WORKER_POLL_INTERVAL_MS default 3000

Evidence: `WORKER.md` · Verification: **VERIFIED**

**Q: Job types?**

A: background_jobs, retry_queue, notification_deliveries, webhooks

Evidence: `job-handlers.ts` · Verification: **VERIFIED**

**Q: Claim mechanism?**

A: SELECT ... FOR UPDATE inside transaction

Evidence: `worker-runner.ts` · Verification: **VERIFIED**

**Q: Graceful shutdown?**

A: SIGTERM/SIGINT — completes tick, releases locks

Evidence: `WORKER.md` · Verification: **VERIFIED**

**Q: Queue monitoring API?**

A: GET /api/v1/system/admin/status

Evidence: `WORKER.md` · Verification: **VERIFIED**

**Q: Dead letter handling?**

A: Manual retry API — auto-replay **NOT VERIFIED**

Evidence: `Implementation_Gaps.md#94` · Verification: **NOT VERIFIED**

**Q: Worker Docker service?**

A: worker service runs node dist/worker.js

Evidence: `docker-compose.yml — **NOT VERIFIED** if file changed` · Verification: **CHANGELOG.md**

**Q: Email delivery queue?**

A: notification_deliveries → processNotificationEmailDelivery

Evidence: `WORKER.md` · Verification: **VERIFIED**

**Q: Scheduled tasks?**

A: background_job_schedules enqueues periodic jobs

Evidence: `WORKER.md` · Verification: **VERIFIED**

### Deployment Errors

**Q: Node version?**

A: 20 per CI workflows

Evidence: `.github/workflows/ci.yml` · Verification: **VERIFIED**

**Q: Database setup script?**

A: npm run db:setup:unix or build-master.ps1

Evidence: `ci.yml` · Verification: **VERIFIED**

**Q: Frontend build?**

A: npm run build --workspace=Frontend_Fintech

Evidence: `ci.yml` · Verification: **VERIFIED**

**Q: Backend build?**

A: npm run build --workspace=Backend_Fintech

Evidence: `ci.yml` · Verification: **VERIFIED**

**Q: Docker Compose stack?**

A: mysql, redis, backend, worker, frontend per CHANGELOG

Evidence: `CHANGELOG.md` · Verification: **VERIFIED**

**Q: Production CD pipeline?**

A: NOT VERIFIED in repository

Evidence: `DevOps_Governance.md` · Verification: **NOT VERIFIED**

**Q: Environment file template?**

A: .env.example and .env.production.example

Evidence: `repo root` · Verification: **VERIFIED**

**Q: nginx config?**

A: Referenced in CHANGELOG security headers — path **NOT VERIFIED**

Evidence: `CHANGELOG.md` · Verification: **PARTIAL**

**Q: Trust proxy setting?**

A: app.set trust proxy 1

Evidence: `app.ts` · Verification: **VERIFIED**

**Q: Integration test count?**

A: 101/101 per CHANGELOG

Evidence: `CHANGELOG.md` · Verification: **VERIFIED**

**Q: E2E test count?**

A: 75 Playwright tests per CHANGELOG

Evidence: `CHANGELOG.md` · Verification: **VERIFIED**

**Q: k6 performance tests?**

A: performance.yml workflow — non-blocking

Evidence: `.github/workflows/performance.yml` · Verification: **VERIFIED**

### Database Errors

**Q: Table count?**

A: 223 tables in master_database.sql

Evidence: `Repository_Statistics.md` · Verification: **VERIFIED**

**Q: Migration approach?**

A: build-master.ps1 concatenates SQL files

Evidence: `Database_Fintech/scripts/build-master.ps1` · Verification: **VERIFIED**

**Q: Connection pool?**

A: mysql2 pool via getPool()

Evidence: `database/connection.ts` · Verification: **VERIFIED**

**Q: Parameterized queries?**

A: mysql2 ? placeholders — 877 SQL AST-parsed

Evidence: `backend-analysis repository-sql-map.json` · Verification: **VERIFIED**

**Q: Rollback scripts count?**

A: 7 partial — full 223 table rollback NOT VERIFIED

Evidence: `Implementation_Gaps.md#66` · Verification: **PARTIAL**

**Q: Stored procedures?**

A: 5 per Repository_Statistics.md

Evidence: `Repository_Statistics.md` · Verification: **VERIFIED**

**Q: Views?**

A: 0 views in schema

Evidence: `Repository_Statistics.md` · Verification: **VERIFIED**

**Q: Soft delete?**

A: deleted_at on 76 table references

Evidence: `Repository_Statistics.md` · Verification: **VERIFIED**

**Q: Read replica?**

A: NOT VERIFIED in code

Evidence: `Implementation_Gaps.md#72` · Verification: **NOT VERIFIED**

**Q: Deadlock handling?**

A: Application rollback on error — automatic retry **NOT VERIFIED**

Evidence: `NOT VERIFIED` · Verification: **NOT VERIFIED**

### Frontend Errors

**Q: Angular version?**

A: 19 standalone per CHANGELOG

Evidence: `CHANGELOG.md` · Verification: **VERIFIED**

### Angular

**Q: Component count?**

A: 153 components

Evidence: `frontend-analysis run-summary.json` · Verification: **VERIFIED**

**Q: Lazy routes?**

A: 161 lazy routes AST-discovered

Evidence: `frontend-analysis run-summary.json` · Verification: **VERIFIED**

**Q: HTTP interceptor chain?**

A: authInterceptor only in app.config.ts

Evidence: `app.config.ts` · Verification: **VERIFIED**

**Q: Permission guard?**

A: permissionGuard(PERMISSIONS.*) factory

Evidence: `permission.guard.ts` · Verification: **VERIFIED**

**Q: State pattern?**

A: State services with signals + API services

Evidence: `merchant-state.service.ts pattern` · Verification: **VERIFIED**

**Q: API service pattern?**

A: *-api.service.ts inject HttpClient

Evidence: `42 *-api.service.ts files` · Verification: **VERIFIED**

**Q: Unit tests (*.spec.ts)?**

A: NOT VERIFIED existence

Evidence: `Implementation_Gaps.md#50` · Verification: **NOT VERIFIED**

**Q: Accessibility audit?**

A: NOT VERIFIED WCAG report

Evidence: `Frontend_Governance.md` · Verification: **NOT VERIFIED**

**Q: i18n?**

A: NOT VERIFIED ngx-translate

Evidence: `NOT VERIFIED` · Verification: **NOT VERIFIED**

### Support

**Q: Where are application logs?**

A: request-logging middleware + morgan — log aggregation **NOT VERIFIED**

Evidence: `app.ts` · Verification: **PARTIAL**

**Q: How to check API liveness?**

A: GET /api/live

Evidence: `app.ts` · Verification: **VERIFIED**

**Q: How to check readiness?**

A: GET /api/ready — includes DB check

Evidence: `app.ts` · Verification: **VERIFIED**

**Q: Audit log location?**

A: audit_logs table via AuditRepository

Evidence: `audit module` · Verification: **VERIFIED**

**Q: Notification preferences?**

A: notification-preferences component + API

Evidence: `notifications module` · Verification: **VERIFIED**

**Q: Feature flags?**

A: featureFlagGuard on /api/v1

Evidence: `feature-flag.middleware.ts` · Verification: **VERIFIED**

**Q: Maintenance mode?**

A: operations module maintenance API

Evidence: `operations routes` · Verification: **VERIFIED**

**Q: Merchant support module?**

A: support module routes + UI

Evidence: `support feature` · Verification: **VERIFIED**

**Q: Error escalation path?**

A: NOT VERIFIED formal runbook until Phase 8

Evidence: `NOT VERIFIED` · Verification: **NOT VERIFIED**

**Q: PCI support scope?**

A: NOT VERIFIED

Evidence: `NOT VERIFIED` · Verification: **NOT VERIFIED**

### Common Questions

**Q: What is Merchant Pro?**

A: Merchant Management Portal v1.0.0-rc1

Evidence: `Executive_Summary.md` · Verification: **VERIFIED**

**Q: How many permissions?**

A: 144 in permissions.ts

Evidence: `shared/rbac/permissions.ts` · Verification: **VERIFIED**

**Q: How many modules?**

A: 46 backend modules per knowledge graph

Evidence: `engineering-knowledge run-summary.json` · Verification: **VERIFIED**

**Q: AI assistant provider?**

A: Gemini — GEMINI_API_KEY env

Evidence: `.env.example` · Verification: **VERIFIED**

**Q: Sandbox environment?**

A: sandbox module exists — prod isolation **NOT VERIFIED**

Evidence: `sandbox module` · Verification: **PARTIAL**

**Q: Webhook signature algorithm?**

A: HMAC per WORKER.md — version **NOT VERIFIED**

Evidence: `Implementation_Gaps.md#95` · Verification: **NOT VERIFIED**

