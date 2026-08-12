# Architecture Decision Records

> **Merchant Pro** · 16 ADRs · v1.0.0-rc1

## Table of Contents

1. [ADR Index](#adr-index)
2. [Records](#records)

---

## ADR Index

| ID | Title | Status |
|----|-------|--------|
| ADR-001 | Angular 19 for Merchant SPA | Accepted |
| ADR-002 | Express 4 for REST API | Accepted |
| ADR-003 | MySQL 8 as System of Record | Accepted |
| ADR-004 | Redis 7 for Locks and Cache | Accepted |
| ADR-005 | JWT HS256 Access Tokens | Accepted |
| ADR-006 | Docker Compose Deployment | Accepted |
| ADR-007 | Swagger OpenAPI Documentation | Accepted |
| ADR-008 | Custom MySQL Job Queues (Not BullMQ) | Accepted |
| ADR-009 | Outbound Webhooks with HMAC | Accepted |
| ADR-010 | REST over GraphQL | Accepted |
| ADR-011 | Dedicated Background Worker Process | Accepted |
| ADR-012 | Database-Backed Feature Flags | Accepted |
| ADR-013 | express-rate-limit with Redis Store | Accepted |
| ADR-014 | Payment Idempotency Keys | Accepted |
| ADR-015 | Rotating Refresh Tokens in Database | Accepted |
| ADR-016 | Zod for Request Validation | Accepted |

---

## Records

### ADR-001: Angular 19 for Merchant SPA

| Field | Value |
|-------|-------|
| Status | Accepted |
| Date | 2026-07-29 |

**Context:** Need enterprise-grade SPA with typed forms, routing, and Material UI.

**Decision:** Adopt Angular 19 with standalone components pattern and Angular Material 19.

**Consequences:** Strong structure for large teams; higher build tooling complexity than lighter frameworks.

---

### ADR-002: Express 4 for REST API

| Field | Value |
|-------|-------|
| Status | Accepted |
| Date | 2026-07-29 |

**Context:** Node.js team expertise; need modular middleware pipeline.

**Decision:** Express 4 with TypeScript, modular route registration per domain (46 modules).

**Consequences:** Mature ecosystem; manual wiring vs framework conventions.

---

### ADR-003: MySQL 8 as System of Record

| Field | Value |
|-------|-------|
| Status | Accepted |
| Date | 2026-07-29 |

**Context:** ACID transactions, relational payment model, team familiarity.

**Decision:** MySQL 8 InnoDB, single `fintech_db` schema with 223 tables, built via `build-master.ps1`.

**Consequences:** Strong consistency; vertical scaling limits mitigated by indexing and read replicas (future).

---

### ADR-004: Redis 7 for Locks and Cache

| Field | Value |
|-------|-------|
| Status | Accepted |
| Date | 2026-07-29 |

**Context:** Multi-instance API/worker needs distributed coordination.

**Decision:** Redis 7 for distributed locks (`lock:*`), optional cache, worker heartbeat — not as primary queue.

**Consequences:** Graceful fallback to in-memory locks when Redis unavailable (single-process only).

---

### ADR-005: JWT HS256 Access Tokens

| Field | Value |
|-------|-------|
| Status | Accepted |
| Date | 2026-07-29 |

**Context:** Stateless API auth with short-lived tokens.

**Decision:** Sign access tokens with HS256 using `JWT_SECRET`; payload includes org/merchant context.

**Consequences:** Simple deployment; secret rotation requires coordinated rollout.

---

### ADR-006: Docker Compose Deployment

| Field | Value |
|-------|-------|
| Status | Accepted |
| Date | 2026-07-29 |

**Context:** UAT/production parity for five services.

**Decision:** Compose file defines mysql, redis, backend, worker, frontend with healthchecks on `/api/ready`.

**Consequences:** Not full Kubernetes; suitable for single-host or small cluster deployments.

---

### ADR-007: Swagger OpenAPI Documentation

| Field | Value |
|-------|-------|
| Status | Accepted |
| Date | 2026-07-29 |

**Context:** Developer portal and integration testing need live API docs.

**Decision:** swagger-jsdoc + swagger-ui-express mounted on API process.

**Consequences:** Docs drift if JSDoc annotations lag; mitigated by integration tests.

---

### ADR-008: Custom MySQL Job Queues (Not BullMQ)

| Field | Value |
|-------|-------|
| Status | Accepted |
| Date | 2026-07-29 |

**Context:** Avoid additional queue infrastructure; leverage existing MySQL expertise.

**Decision:** Queue tables (`background_jobs`, `retry_queue`, `webhook_delivery_queue`, `payment_webhook_deliveries`, `notification_deliveries`) claimed with `SELECT ... FOR UPDATE` inside transactions.

**Consequences:** No Redis queue dependency; polling overhead acceptable at current scale; Redis used only for locks.

---

### ADR-009: Outbound Webhooks with HMAC

| Field | Value |
|-------|-------|
| Status | Accepted |
| Date | 2026-07-29 |

**Context:** Merchants need reliable event notifications.

**Decision:** Persist deliveries in MySQL; worker POSTs with HMAC-SHA256 signature; retry via `retry_queue`.

**Consequences:** At-least-once delivery; merchants must implement idempotent handlers.

---

### ADR-010: REST over GraphQL

| Field | Value |
|-------|-------|
| Status | Accepted |
| Date | 2026-07-29 |

**Context:** Payment APIs favor predictable resources and cacheable GETs.

**Decision:** Versioned REST under `/api/v1` with resource-oriented URLs.

**Consequences:** Multiple round-trips for complex dashboards; acceptable with BFF-style aggregation in frontend services.

---

### ADR-011: Dedicated Background Worker Process

| Field | Value |
|-------|-------|
| Status | Accepted |
| Date | 2026-07-29 |

**Context:** Webhook/email latency must not block HTTP threads.

**Decision:** Separate Node process (`dist/worker.js`) with configurable concurrency and poll interval.

**Consequences:** Second deployable unit; shared codebase with API for handlers.

---

### ADR-012: Database-Backed Feature Flags

| Field | Value |
|-------|-------|
| Status | Accepted |
| Date | 2026-07-29 |

**Context:** Gradual rollout per organization without redeploy.

**Decision:** Feature flags stored in `feature_flags` table; evaluated at runtime in services.

**Consequences:** Requires cache invalidation strategy; Redis cache optional for hot paths.

---

### ADR-013: express-rate-limit with Redis Store

| Field | Value |
|-------|-------|
| Status | Accepted |
| Date | 2026-07-29 |

**Context:** Protect auth and public endpoints from abuse.

**Decision:** Global and route-specific rate limits; health paths exempt.

**Consequences:** Shared limits across instances when Redis enabled.

---

### ADR-014: Payment Idempotency Keys

| Field | Value |
|-------|-------|
| Status | Accepted |
| Date | 2026-07-29 |

**Context:** Network retries must not double-charge.

**Decision:** Unique constraint on `(merchant_id, idempotency_key)` in `payment_intents` and `payment_idempotency_keys` cache table.

**Consequences:** Clients must supply `Idempotency-Key` header for create operations.

---

### ADR-015: Rotating Refresh Tokens in Database

| Field | Value |
|-------|-------|
| Status | Accepted |
| Date | 2026-07-29 |

**Context:** Long-lived sessions without storing JWT refresh in localStorage alone.

**Decision:** Opaque refresh tokens hashed (SHA-256) in `refresh_tokens`; rotation on each refresh; `remember device` extends TTL to 30d.

**Consequences:** DB lookup on refresh; revocable sessions per device.

---

### ADR-016: Zod for Request Validation

| Field | Value |
|-------|-------|
| Status | Accepted |
| Date | 2026-07-29 |

**Context:** Type-safe DTO validation at API boundary.

**Decision:** Zod schemas in module `dto/` folders; `ZodError` mapped to 400 by error handler.

**Consequences:** Runtime validation overhead negligible vs I/O.

