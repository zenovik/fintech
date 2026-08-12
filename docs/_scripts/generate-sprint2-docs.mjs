#!/usr/bin/env node
/**
 * Generates Sprint 2 enterprise documentation (Architecture, Database, Solution Design).
 * Library module — run: node docs/_scripts/generate-sprint2-run.mjs
 */
import { mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const P1 = '../01_Product';
const ARCH = join(ROOT, '02_Architecture');
const DB = join(ROOT, '03_Database');
const SD = join(ROOT, '04_Solution_Design');

const STATS = { files: 0, adrs: 0, mermaid: 0, sequence: 0, er: 0 };

const STD_SECTIONS = [
  'Purpose', 'Responsibilities', 'Components', 'Dependencies', 'Communication',
  'Data Flow', 'Trust Boundaries', 'Failure Handling', 'Scalability', 'Limitations',
  'Future Evolution', 'Cross References',
];

function slug(s) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function countMermaid(text) {
  return (text.match(/```mermaid/g) || []).length;
}

function writeDoc(dir, name, content) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), content, 'utf8');
  STATS.files++;
  STATS.mermaid += countMermaid(content);
}

function archDoc(title, body, extra = '') {
  const toc = STD_SECTIONS.map((s, i) => `${i + 1}. [${s}](#${slug(s)})`).join('\n');
  const sections = STD_SECTIONS.map((name) => {
    const content = body[name] || `See [${P1}/Product_Functional_Specification.md](${P1}/Product_Functional_Specification.md) for business context. Technical detail is covered in sibling architecture documents.`;
    return `## ${name}\n\n${content}`;
  }).join('\n\n');
  return `# ${title}\n\n> **Merchant Pro Enterprise Architecture** · v1.0.0-rc1 · Product: [01_Product](${P1}/README.md)\n\n## Table of Contents\n\n${toc}\n\n---\n\n${extra ? extra + '\n\n---\n\n' : ''}${sections}\n`;
}

function dbDoc(title, sections) {
  const keys = Object.keys(sections);
  const toc = keys.map((s, i) => `${i + 1}. [${s}](#${slug(s)})`).join('\n');
  const body = keys.map((k) => `## ${k}\n\n${sections[k]}`).join('\n\n');
  return `# ${title}\n\n> **Merchant Pro Database Architecture** · v1.0.0-rc1 · Schema: \`Database_Fintech/master_database.sql\` (223 tables)\n\n## Table of Contents\n\n${toc}\n\n---\n\n${body}\n`;
}

function sdDoc(title, sections) {
  const keys = Object.keys(sections);
  const toc = keys.map((s, i) => `${i + 1}. [${s}](#${slug(s)})`).join('\n');
  const body = keys.map((k) => `## ${k}\n\n${sections[k]}`).join('\n\n');
  return `# ${title}\n\n> **Merchant Pro Solution Design** · v1.0.0-rc1\n\n## Table of Contents\n\n${toc}\n\n---\n\n${body}\n`;
}

const COMMON = {
  platform: 'Merchant Pro is a monorepo fintech platform: **Angular 19 SPA**, **Express 4 API** (46 modules), **MySQL 8** (`fintech_db`, 223 tables), **Redis 7** (distributed locks and cache), and a **background worker** using custom MySQL job queues with `SELECT ... FOR UPDATE` (not BullMQ).',
  docker: 'Docker Compose services: `mysql`, `redis`, `backend`, `worker`, `frontend` on bridge network `fintech-network`.',
  auth: 'JWT access tokens (HS256), refresh tokens (hashed in DB), CSRF double-submit cookie, 144 RBAC permissions.',
  health: 'Health endpoints: `GET /api/live`, `GET /api/ready`, `GET /api/health`.',
  product: `Business requirements and user journeys live in [01_Product](${P1}/README.md). This document describes technical architecture only.`,
};

// --- Sequence diagrams ---
const SEQ_MERCHANT_LOGIN = `\`\`\`mermaid
sequenceDiagram
  autonumber
  actor U as Merchant User
  participant SPA as Angular SPA
  participant API as Express API
  participant Auth as Auth Module
  participant DB as MySQL
  participant Redis as Redis

  U->>SPA: Enter credentials
  SPA->>API: POST /api/v1/auth/login
  API->>Auth: Validate credentials
  Auth->>DB: SELECT users + org membership
  Auth->>DB: INSERT user_sessions, refresh_tokens
  Auth->>Redis: Optional session cache
  Auth-->>API: JWT access + refresh token
  API-->>SPA: 200 + Set-Cookie (CSRF)
  SPA-->>U: Dashboard redirect
\`\`\``;
STATS.sequence++;

const SEQ_REFRESH_TOKEN = `\`\`\`mermaid
sequenceDiagram
  autonumber
  participant SPA as Angular SPA
  participant API as Express API
  participant Auth as TokenService
  participant DB as MySQL

  SPA->>API: POST /api/v1/auth/refresh (refresh cookie)
  API->>Auth: hash(refreshToken)
  Auth->>DB: SELECT refresh_tokens WHERE hash AND not revoked
  alt valid and not expired
    Auth->>DB: Rotate refresh token row
    Auth-->>API: New access + refresh pair
    API-->>SPA: 200 TokenPair
  else invalid
    Auth-->>API: UnauthorizedError
    API-->>SPA: 401
  end
\`\`\``;
STATS.sequence++;

const SEQ_PAYMENT_AUTH_CAPTURE = `\`\`\`mermaid
sequenceDiagram
  autonumber
  participant Dev as Developer / Checkout
  participant API as Payment API
  participant Engine as PaymentEngineService
  participant DB as MySQL
  participant WH as Webhook Queue

  Dev->>API: POST /api/v1/payments (Idempotency-Key)
  API->>Engine: createPayment()
  Engine->>DB: Check payment_idempotency_keys
  Engine->>DB: INSERT payment_intents (pending)
  Engine->>DB: INSERT payment_timeline_events
  Dev->>API: POST authorize
  Engine->>DB: UPDATE status authorized
  Dev->>API: POST capture
  Engine->>DB: UPDATE status captured, amount_captured
  Engine->>DB: INSERT payment_webhook_deliveries
  Engine-->>WH: Worker delivers HMAC webhook
\`\`\``;
STATS.sequence++;

const SEQ_REFUND = `\`\`\`mermaid
sequenceDiagram
  autonumber
  participant Op as Merchant Operator
  participant API as Refund API
  participant Svc as Refund Service
  participant DB as MySQL
  participant Audit as Audit Recorder

  Op->>API: POST /api/v1/refunds
  API->>Svc: createRefund (permission refunds:write)
  Svc->>DB: SELECT payment_intents FOR UPDATE
  Svc->>DB: INSERT refunds, refund_status_history
  Svc->>DB: UPDATE payment_intents amount_refunded
  Svc->>Audit: Record audit event
  Svc->>DB: Enqueue webhook delivery
  API-->>Op: 201 Refund created
\`\`\``;
STATS.sequence++;

const SEQ_WEBHOOK_DELIVERY = `\`\`\`mermaid
sequenceDiagram
  autonumber
  participant Worker as Worker Process
  participant DB as MySQL
  participant Redis as Redis
  participant EP as Merchant Endpoint

  Worker->>DB: SELECT payment_webhook_deliveries FOR UPDATE
  Worker->>Redis: acquireLock(lock:webhook:*)
  Worker->>EP: POST payload + HMAC signature
  alt HTTP 2xx
    Worker->>DB: status delivered
  else failure
    Worker->>DB: INSERT retry_queue (scheduled_at backoff)
    Worker->>DB: status failed
  end
  Worker->>Redis: releaseLock
\`\`\``;
STATS.sequence++;

const SEQ_WORKER_RETRY = `\`\`\`mermaid
sequenceDiagram
  autonumber
  participant W as Worker Runner
  participant DB as MySQL
  participant H as Job Handler
  participant SMTP as Email / HTTP

  loop each tick (WORKER_POLL_INTERVAL_MS)
    W->>DB: SELECT retry_queue FOR UPDATE (pending/failed)
    W->>DB: UPDATE status processing, attempt_count++
    W->>H: processRetryQueueItem
    H->>SMTP: Retry webhook or email
    alt success
      H->>DB: status completed
    else attempts < max_attempts
      H->>DB: status pending, scheduled_at exponential
    else
      H->>DB: status dead / failed
    end
  end
\`\`\``;
STATS.sequence++;

// --- C4 diagrams ---
function c4Block(level, title, diagram) {
  return `### C4 Level ${level} — ${title}\n\n\`\`\`mermaid\n${diagram.trim()}\n\`\`\``;
}

const C4_CONTEXT_L1 = `C4Context
  title Merchant Pro — System Context (L1)
  Person(merchant, "Merchant User", "Operates portal")
  Person(dev, "Developer", "Integrates payments API")
  Person(admin, "Platform Admin", "Configures org")
  System(mpro, "Merchant Pro", "Payment & merchant platform")
  System_Ext(gateway, "Payment Gateway", "Acquirer / PSP")
  System_Ext(smtp, "SMTP", "Email delivery")
  Rel(merchant, mpro, "Uses HTTPS")
  Rel(dev, mpro, "REST API + webhooks")
  Rel(admin, mpro, "Administration")
  Rel(mpro, gateway, "Authorize / capture")
  Rel(mpro, smtp, "Transactional email")`;

const C4_CONTEXT_L2 = `C4Context
  title Extended Context — Actors & Compliance (L2)
  Person(customer, "End Customer", "Pays via checkout")
  System(mpro, "Merchant Pro")
  System_Ext(bank, "Issuing Bank", "Card authorization")
  System_Ext(gateway, "Payment Gateway")
  SystemDb_Ext(audit, "Audit Retention", "Compliance archive")
  Rel(customer, mpro, "Hosted checkout")
  Rel(mpro, gateway, "Card rails")
  Rel(gateway, bank, "Authorization")
  Rel(mpro, audit, "Export audit logs")`;

const C4_CONTEXT_L3 = `flowchart TB
  subgraph External
    U[Users]
    API_C[API Consumers]
  end
  subgraph MerchantPro["Merchant Pro Platform"]
    FE[Angular SPA]
    BE[Express API]
    WK[Worker]
  end
  subgraph Data
    MY[(MySQL)]
    RD[(Redis)]
  end
  U --> FE --> BE
  API_C --> BE
  BE --> MY
  BE --> RD
  WK --> MY
  WK --> RD`;

const C4_CONTEXT_L4 = `flowchart LR
  subgraph TrustZones
    PZ[Public Zone]
    AZ[Application Zone]
    DZ[Data Zone]
  end
  PZ -->|TLS| AZ
  AZ -->|Private network| DZ
  note1[No direct DB access from browser]`;

const C4_CONTAINER_L1 = `C4Container
  title Merchant Pro — Containers (L1)
  Person(user, "User")
  Container(spa, "Angular SPA", "TypeScript", "Merchant UI")
  Container(api, "Express API", "Node 20", "REST + Swagger")
  Container(worker, "Worker", "Node 20", "Queues + webhooks")
  ContainerDb(mysql, "MySQL 8", "InnoDB", "fintech_db 223 tables")
  ContainerDb(redis, "Redis 7", "Cache/Locks")
  Rel(user, spa, "HTTPS")
  Rel(spa, api, "JSON /api/v1")
  Rel(api, mysql, "mysql2 pool")
  Rel(api, redis, "ioredis")
  Rel(worker, mysql, "Job claim FOR UPDATE")
  Rel(worker, redis, "Distributed locks")`;

const C4_CONTAINER_L2 = `flowchart TB
  subgraph DockerCompose
    FE[fintech-frontend :4200]
    BE[fintech-backend :3000]
    WK[fintech-worker]
    MY[fintech-mysql :3306]
    RD[fintech-redis :6379]
  end
  FE --> BE
  BE --> MY
  BE --> RD
  WK --> MY
  WK --> RD
  WK -.depends on.-> BE`;

const C4_CONTAINER_L3 = `flowchart LR
  subgraph APIProcess["Express Process"]
    R[Routes]
    M[Middleware Chain]
    S[Services]
    RE[Repositories]
  end
  R --> M --> S --> RE
  RE --> MY[(MySQL)]`;

const C4_CONTAINER_L4 = `flowchart TB
  subgraph Volumes
    UP[backend_uploads]
    LG[backend_logs]
    MD[mysql_data]
  end
  BE[backend] --> UP
  BE --> LG
  WK[worker] --> UP
  WK --> LG
  MY[mysql] --> MD`;

const C4_COMPONENT_L1 = `C4Component
  title API — Major Components (L1)
  Container(api, "Express API")
  Component(auth, "Auth Module", "JWT, sessions")
  Component(pay, "Payments Module", "Intents, capture")
  Component(chk, "Checkout Module", "Hosted sessions")
  Component(wh, "Webhooks Module", "Subscriptions, delivery")
  Component(rbac, "RBAC Middleware", "144 permissions")
  Component(sys, "System Module", "Health, metrics")
  Rel(api, auth, "routes")
  Rel(api, pay, "routes")
  Rel(api, chk, "routes")
  Rel(api, wh, "routes")
  Rel(auth, rbac, "token payload")
  Rel(pay, wh, "events")`;

const C4_COMPONENT_L2 = `flowchart TB
  subgraph Shared
    EH[Error Handler]
    RL[Rate Limiter]
    CSRF[CSRF Middleware]
    LOG[Logger]
    MET[Metrics Registry]
  end
  subgraph Modules["46 API Modules"]
    direction TB
    AUTH[auth]
    PAY[payments]
    REF[refunds]
    NTF[notifications]
  end
  AUTH --> EH
  PAY --> EH
  Modules --> RL
  Modules --> CSRF
  Modules --> LOG
  Modules --> MET`;

const C4_COMPONENT_L3 = `flowchart LR
  subgraph PaymentModule
    PC[PaymentController]
    PS[PaymentEngineService]
    PR[PaymentRepository]
  end
  PC --> PS --> PR
  PS --> Audit[AuditRecorder]
  PS --> WHQ[payment_webhook_deliveries]`;

const C4_COMPONENT_L4 = `classDiagram
  class PaymentEngineService {
    +createPayment()
    +authorize()
    +capture()
    +getIdempotency()
  }
  class PaymentRepository {
    +insertIntent()
    +updateStatus()
  }
  class WebhookDeliveryEngine {
    +deliver()
  }
  PaymentEngineService --> PaymentRepository
  PaymentEngineService --> WebhookDeliveryEngine`;

// --- ER diagrams ---
const ER_IDENTITY = `\`\`\`mermaid
erDiagram
  users ||--o{ user_sessions : has
  users ||--o{ refresh_tokens : has
  users ||--o{ organization_members : belongs
  users ||--o{ password_history : tracks
  users ||--o{ login_attempts : logs
  organizations ||--o{ organization_members : includes
  organization_members }o--|| organization_roles : assigned
  users {
    bigint id PK
    char uuid UK
    varchar email UK
    varchar password_hash
    enum status
    datetime deleted_at
  }
  refresh_tokens {
    bigint id PK
    bigint user_id FK
    varchar token_hash
    datetime expires_at
    datetime revoked_at
  }
\`\`\``;
STATS.er++;

const ER_MERCHANT = `\`\`\`mermaid
erDiagram
  organizations ||--o{ merchants : owns
  merchants ||--o{ merchant_addresses : has
  merchants ||--o{ merchant_users : employs
  merchants ||--o{ outlets : operates
  merchants }o--|| regions : located
  merchant_users }o--|| users : links
  merchants {
    bigint id PK
    char uuid UK
    varchar merchant_code UK
    enum kyc_status
    enum status
    datetime deleted_at
  }
\`\`\``;
STATS.er++;

const ER_PAYMENTS = `\`\`\`mermaid
erDiagram
  merchants ||--o{ payment_orders : creates
  payment_orders ||--o{ payment_intents : contains
  payment_intents ||--o{ payment_timeline_events : logs
  payment_intents ||--o| payment_sessions : opens
  payment_intents }o--o| transactions : settles
  payment_intents {
    bigint id PK
    varchar intent_ref UK
    enum status
    decimal amount
    varchar idempotency_key
  }
\`\`\``;
STATS.er++;

const ER_CHECKOUT = `\`\`\`mermaid
erDiagram
  checkout_sessions }o--|| payment_intents : pays
  checkout_sessions }o--o| checkout_themes : styled
  checkout_sessions ||--o{ checkout_session_events : tracks
  merchants ||--o{ checkout_sessions : hosts
  checkout_sessions {
    bigint id PK
    varchar checkout_ref UK
    enum status
    enum checkout_mode
    datetime expires_at
  }
\`\`\``;
STATS.er++;

const ER_REFUNDS = `\`\`\`mermaid
erDiagram
  payment_intents ||--o{ refunds : reversed
  refunds ||--o{ refund_status_history : tracks
  merchants ||--o{ refunds : initiates
  refunds {
    bigint id PK
    bigint payment_intent_id FK
    decimal amount
    enum status
    varchar reason
  }
\`\`\``;
STATS.er++;

const ER_SUBSCRIPTIONS = `\`\`\`mermaid
erDiagram
  merchants ||--o{ subscription_plans : offers
  subscription_plans ||--o{ subscriptions : sold
  subscriptions ||--o{ subscription_invoices : bills
  customers ||--o{ subscriptions : subscribes
  subscriptions {
    bigint id PK
    enum status
    date current_period_start
    date current_period_end
  }
\`\`\``;
STATS.er++;

const ER_INVOICES = `\`\`\`mermaid
erDiagram
  merchants ||--o{ invoices : issues
  invoices ||--o{ invoice_line_items : contains
  invoices ||--o{ invoice_payments : paid_by
  customers ||--o{ invoices : billed
  invoices {
    bigint id PK
    varchar invoice_number UK
    enum status
    decimal total_amount
    datetime due_date
  }
\`\`\``;
STATS.er++;

const ER_NOTIFICATIONS = `\`\`\`mermaid
erDiagram
  users ||--o{ notifications : receives
  notifications ||--o{ notification_deliveries : channels
  notification_templates ||--o{ notifications : renders
  notification_deliveries {
    bigint id PK
    enum channel
    enum status
    datetime sent_at
  }
\`\`\``;
STATS.er++;

const ER_AUDIT = `\`\`\`mermaid
erDiagram
  users ||--o{ audit_logs : performs
  organizations ||--o{ audit_logs : scopes
  merchants ||--o{ audit_logs : scopes
  audit_logs ||--o{ audit_log_details : expands
  audit_logs {
    bigint id PK
    varchar action
    varchar resource_type
    bigint resource_id
    json metadata
  }
\`\`\``;
STATS.er++;

const ER_CONFIG = `\`\`\`mermaid
erDiagram
  organizations ||--o{ organization_preferences : configures
  organizations ||--o{ feature_flags : toggles
  organizations ||--o{ platform_settings : overrides
  feature_flags {
    bigint id PK
    varchar flag_key
    tinyint enabled
    json conditions
  }
  platform_settings {
    bigint id PK
    varchar setting_key UK
    text setting_value
  }
\`\`\``;
STATS.er++;

// --- ADRs ---
const ADRS = [
  { id: 'ADR-001', title: 'Angular 19 for Merchant SPA', status: 'Accepted', context: 'Need enterprise-grade SPA with typed forms, routing, and Material UI.', decision: 'Adopt Angular 19 with standalone components pattern and Angular Material 19.', consequences: 'Strong structure for large teams; higher build tooling complexity than lighter frameworks.' },
  { id: 'ADR-002', title: 'Express 4 for REST API', status: 'Accepted', context: 'Node.js team expertise; need modular middleware pipeline.', decision: 'Express 4 with TypeScript, modular route registration per domain (46 modules).', consequences: 'Mature ecosystem; manual wiring vs framework conventions.' },
  { id: 'ADR-003', title: 'MySQL 8 as System of Record', status: 'Accepted', context: 'ACID transactions, relational payment model, team familiarity.', decision: 'MySQL 8 InnoDB, single `fintech_db` schema with 223 tables, built via `build-master.ps1`.', consequences: 'Strong consistency; vertical scaling limits mitigated by indexing and read replicas (future).' },
  { id: 'ADR-004', title: 'Redis 7 for Locks and Cache', status: 'Accepted', context: 'Multi-instance API/worker needs distributed coordination.', decision: 'Redis 7 for distributed locks (`lock:*`), optional cache, worker heartbeat — not as primary queue.', consequences: 'Graceful fallback to in-memory locks when Redis unavailable (single-process only).' },
  { id: 'ADR-005', title: 'JWT HS256 Access Tokens', status: 'Accepted', context: 'Stateless API auth with short-lived tokens.', decision: 'Sign access tokens with HS256 using `JWT_SECRET`; payload includes org/merchant context.', consequences: 'Simple deployment; secret rotation requires coordinated rollout.' },
  { id: 'ADR-006', title: 'Docker Compose Deployment', status: 'Accepted', context: 'UAT/production parity for five services.', decision: 'Compose file defines mysql, redis, backend, worker, frontend with healthchecks on `/api/ready`.', consequences: 'Not full Kubernetes; suitable for single-host or small cluster deployments.' },
  { id: 'ADR-007', title: 'Swagger OpenAPI Documentation', status: 'Accepted', context: 'Developer portal and integration testing need live API docs.', decision: 'swagger-jsdoc + swagger-ui-express mounted on API process.', consequences: 'Docs drift if JSDoc annotations lag; mitigated by integration tests.' },
  { id: 'ADR-008', title: 'Custom MySQL Job Queues (Not BullMQ)', status: 'Accepted', context: 'Avoid additional queue infrastructure; leverage existing MySQL expertise.', decision: 'Queue tables (`background_jobs`, `retry_queue`, `webhook_delivery_queue`, `payment_webhook_deliveries`, `notification_deliveries`) claimed with `SELECT ... FOR UPDATE` inside transactions.', consequences: 'No Redis queue dependency; polling overhead acceptable at current scale; Redis used only for locks.' },
  { id: 'ADR-009', title: 'Outbound Webhooks with HMAC', status: 'Accepted', context: 'Merchants need reliable event notifications.', decision: 'Persist deliveries in MySQL; worker POSTs with HMAC-SHA256 signature; retry via `retry_queue`.', consequences: 'At-least-once delivery; merchants must implement idempotent handlers.' },
  { id: 'ADR-010', title: 'REST over GraphQL', status: 'Accepted', context: 'Payment APIs favor predictable resources and cacheable GETs.', decision: 'Versioned REST under `/api/v1` with resource-oriented URLs.', consequences: 'Multiple round-trips for complex dashboards; acceptable with BFF-style aggregation in frontend services.' },
  { id: 'ADR-011', title: 'Dedicated Background Worker Process', status: 'Accepted', context: 'Webhook/email latency must not block HTTP threads.', decision: 'Separate Node process (`dist/worker.js`) with configurable concurrency and poll interval.', consequences: 'Second deployable unit; shared codebase with API for handlers.' },
  { id: 'ADR-012', title: 'Database-Backed Feature Flags', status: 'Accepted', context: 'Gradual rollout per organization without redeploy.', decision: 'Feature flags stored in `feature_flags` table; evaluated at runtime in services.', consequences: 'Requires cache invalidation strategy; Redis cache optional for hot paths.' },
  { id: 'ADR-013', title: 'express-rate-limit with Redis Store', status: 'Accepted', context: 'Protect auth and public endpoints from abuse.', decision: 'Global and route-specific rate limits; health paths exempt.', consequences: 'Shared limits across instances when Redis enabled.' },
  { id: 'ADR-014', title: 'Payment Idempotency Keys', status: 'Accepted', context: 'Network retries must not double-charge.', decision: 'Unique constraint on `(merchant_id, idempotency_key)` in `payment_intents` and `payment_idempotency_keys` cache table.', consequences: 'Clients must supply `Idempotency-Key` header for create operations.' },
  { id: 'ADR-015', title: 'Rotating Refresh Tokens in Database', status: 'Accepted', context: 'Long-lived sessions without storing JWT refresh in localStorage alone.', decision: 'Opaque refresh tokens hashed (SHA-256) in `refresh_tokens`; rotation on each refresh; `remember device` extends TTL to 30d.', consequences: 'DB lookup on refresh; revocable sessions per device.' },
  { id: 'ADR-016', title: 'Zod for Request Validation', status: 'Accepted', context: 'Type-safe DTO validation at API boundary.', decision: 'Zod schemas in module `dto/` folders; `ZodError` mapped to 400 by error handler.', consequences: 'Runtime validation overhead negligible vs I/O.' },
];
STATS.adrs = ADRS.length;

function buildAdrDoc() {
  const rows = ADRS.map((a) => `| ${a.id} | ${a.title} | ${a.status} |`).join('\n');
  const bodies = ADRS.map((a) => `### ${a.id}: ${a.title}\n\n| Field | Value |\n|-------|-------|\n| Status | ${a.status} |\n| Date | 2026-07-29 |\n\n**Context:** ${a.context}\n\n**Decision:** ${a.decision}\n\n**Consequences:** ${a.consequences}\n`).join('\n---\n\n');
  return `# Architecture Decision Records\n\n> **Merchant Pro** · ${ADRS.length} ADRs · v1.0.0-rc1\n\n## Table of Contents\n\n1. [ADR Index](#adr-index)\n2. [Records](#records)\n\n---\n\n## ADR Index\n\n| ID | Title | Status |\n|----|-------|--------|\n${rows}\n\n---\n\n## Records\n\n${bodies}\n`;
}

// Export generation functions - continued in part 2
export { ARCH, DB, SD, STATS, writeDoc, archDoc, dbDoc, sdDoc, COMMON, buildAdrDoc,
  SEQ_MERCHANT_LOGIN, SEQ_REFRESH_TOKEN, SEQ_PAYMENT_AUTH_CAPTURE, SEQ_REFUND,
  SEQ_WEBHOOK_DELIVERY, SEQ_WORKER_RETRY,
  c4Block, C4_CONTEXT_L1, C4_CONTEXT_L2, C4_CONTEXT_L3, C4_CONTEXT_L4,
  C4_CONTAINER_L1, C4_CONTAINER_L2, C4_CONTAINER_L3, C4_CONTAINER_L4,
  C4_COMPONENT_L1, C4_COMPONENT_L2, C4_COMPONENT_L3, C4_COMPONENT_L4,
  ER_IDENTITY, ER_MERCHANT, ER_PAYMENTS, ER_CHECKOUT, ER_REFUNDS,
  ER_SUBSCRIPTIONS, ER_INVOICES, ER_NOTIFICATIONS, ER_AUDIT, ER_CONFIG,
  P1, STD_SECTIONS, slug };
