#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ARCH, DB, SD, STATS, writeDoc, archDoc, dbDoc, sdDoc, COMMON, buildAdrDoc,
  SEQ_MERCHANT_LOGIN, SEQ_REFRESH_TOKEN, SEQ_PAYMENT_AUTH_CAPTURE, SEQ_REFUND,
  SEQ_WEBHOOK_DELIVERY, SEQ_WORKER_RETRY,
  c4Block, C4_CONTEXT_L1, C4_CONTEXT_L2, C4_CONTEXT_L3, C4_CONTEXT_L4,
  C4_CONTAINER_L1, C4_CONTAINER_L2, C4_CONTAINER_L3, C4_CONTAINER_L4,
  C4_COMPONENT_L1, C4_COMPONENT_L2, C4_COMPONENT_L3, C4_COMPONENT_L4,
  ER_IDENTITY, ER_MERCHANT, ER_PAYMENTS, ER_CHECKOUT, ER_REFUNDS,
  ER_SUBSCRIPTIONS, ER_INVOICES, ER_NOTIFICATIONS, ER_AUDIT, ER_CONFIG,
  P1,
} from './generate-sprint2-docs.mjs';

mkdirSync(ARCH, { recursive: true });
mkdirSync(DB, { recursive: true });
mkdirSync(SD, { recursive: true });

const X = (s) => s;

// --- README files ---
writeDoc(ARCH, 'README.md', `# Enterprise Architecture — Merchant Pro

Technical architecture for v1.0.0-rc1. Business context: [01_Product](../01_Product/README.md).

| Layer | Path |
|-------|------|
| Product | [01_Product](../01_Product/README.md) |
| Architecture | This folder (28 documents) |
| Database | [03_Database](../03_Database/README.md) |
| Solution Design | [04_Solution_Design](../04_Solution_Design/README.md) |

## Index

| Category | Documents |
|----------|-----------|
| Core | [Overview](./Architecture_Overview.md), [High Level](./High_Level_Architecture.md), [Low Level](./Low_Level_Architecture.md), [Principles](./Architecture_Principles.md), [Stack](./Technology_Stack.md), [ADRs](./Architecture_Decision_Records.md) |
| C4 | [Context](./Context_Diagram.md), [Container](./Container_Diagram.md), [Component](./Component_Diagram.md) |
| Infrastructure | [Deployment](./Deployment_Architecture.md), [Infrastructure](./Infrastructure_Architecture.md), [Network](./Network_Architecture.md), [Trust Boundaries](./Trust_Boundaries.md) |
| Domain | [Integration](./Integration_Architecture.md), [Security](./Security_Architecture.md), [Authentication](./Authentication_Architecture.md), [Authorization](./Authorization_Architecture.md), [Payment](./Payment_Architecture.md), [Webhook](./Webhook_Architecture.md), [Worker](./Worker_Architecture.md), [Notification](./Notification_Architecture.md) |
| Operations | [Caching](./Caching_Architecture.md), [Monitoring](./Monitoring_Architecture.md), [Logging](./Logging_Architecture.md), [Availability](./Availability_Architecture.md), [Scalability](./Scalability_Architecture.md), [DR](./Disaster_Recovery.md) |
`);

writeDoc(DB, 'README.md', `# Database Architecture — Merchant Pro

Schema source: \`Database_Fintech/master_database.sql\` · **223 tables** · **50** with \`deleted_at\`

| Document | Description |
|----------|-------------|
| [Database_Overview.md](./Database_Overview.md) | Platform data store |
| [ERD.md](./ERD.md) | Domain ER diagrams (10) |
| [Data_Model.md](./Data_Model.md) | Logical domains |
| [Relationships.md](./Relationships.md) | FK cardinality |
| [Indexes.md](./Indexes.md) | Index strategy |
| [Constraints.md](./Constraints.md) | Integrity rules |
| [Naming_Standards.md](./Naming_Standards.md) | Conventions |
| [Migration_Strategy.md](./Migration_Strategy.md) | Build pipeline |
| [Soft_Delete_Strategy.md](./Soft_Delete_Strategy.md) | \`deleted_at\` |
| [Archival_Strategy.md](./Archival_Strategy.md) | Long-term retention |
| [Backup_Strategy.md](./Backup_Strategy.md) | Backup |
| [Recovery_Strategy.md](./Recovery_Strategy.md) | RPO/RTO |
| [Partitioning_Strategy.md](./Partitioning_Strategy.md) | Future sharding |
| [Performance_Considerations.md](./Performance_Considerations.md) | Tuning |
| [Data_Dictionary.md](./Data_Dictionary.md) | Major entities |

Product: [01_Product](../01_Product/README.md)
`);

writeDoc(SD, 'README.md', `# Solution Design — Merchant Pro

| Document | Description |
|----------|-------------|
| [Solution_Overview.md](./Solution_Overview.md) | 4+1 views |
| [Module_Interaction.md](./Module_Interaction.md) | Inter-module flows |
| [Runtime_View.md](./Runtime_View.md) | Process model |
| [Deployment_View.md](./Deployment_View.md) | Containers |
| [Operational_View.md](./Operational_View.md) | Ops |
| [Logical_View.md](./Logical_View.md) | Layers |
| [Physical_View.md](./Physical_View.md) | Hardware |
| [Concurrency_Model.md](./Concurrency_Model.md) | Parallelism |
| [Threading_and_Async_Model.md](./Threading_and_Async_Model.md) | Node async |
| [Transaction_Model.md](./Transaction_Model.md) | DB TX |
| [Consistency_Model.md](./Consistency_Model.md) | ACID |
| [Error_Handling_Model.md](./Error_Handling_Model.md) | Error taxonomy |
| [Validation_Model.md](./Validation_Model.md) | Zod |
| [Integration_Model.md](./Integration_Model.md) | External |
| [API_Design.md](./API_Design.md) | REST |
| [Security_Model.md](./Security_Model.md) | Defense |
| [Configuration_Model.md](./Configuration_Model.md) | Env |
| [Observability_Model.md](./Observability_Model.md) | Logs/metrics |
| [Performance_Model.md](./Performance_Model.md) | Throughput |

Links: [02_Architecture](../02_Architecture/README.md) · [03_Database](../03_Database/README.md)
`);

// --- Architecture files ---
const archBase = {
  Purpose: COMMON.product,
  Responsibilities: 'Define technical structure, boundaries, and cross-cutting concerns for Merchant Pro v1.0.0-rc1.',
  Components: 'Angular SPA, Express API (46 modules), Worker, MySQL, Redis, Docker Compose stack.',
  Dependencies: 'Node 20+, MySQL 8, Redis 7, SMTP for email, external payment gateway.',
  Communication: 'HTTPS JSON REST between SPA and API; worker polls MySQL queues; Redis pub/sub not used.',
  'Data Flow': 'Request → middleware → controller → service → repository → MySQL. Async side effects enqueue rows for worker.',
  'Trust Boundaries': 'Public internet → TLS → API → private DB network. See [Trust_Boundaries.md](./Trust_Boundaries.md).',
  'Failure Handling': 'Structured `AppError` responses; worker retries with exponential backoff; health endpoints for orchestration.',
  Scalability: 'Horizontally scale API and worker replicas; Redis locks coordinate; MySQL remains primary bottleneck.',
  Limitations: 'Single-region deployment in rc1; no read replica requirement; polling-based queues.',
  'Future Evolution': 'Read replicas, event outbox, multi-region DR, gateway abstraction layer.',
  'Cross References': `[01_Product](${P1}/README.md) · [03_Database](../03_Database/README.md) · [04_Solution_Design](../04_Solution_Design/README.md)`,
};

writeDoc(ARCH, 'Architecture_Overview.md', archDoc('Architecture Overview', {
  ...archBase,
  Purpose: `${COMMON.platform} ${COMMON.product}`,
  Responsibilities: 'Provide a single entry point to Merchant Pro technical architecture: layers, runtime processes, data stores, and integration points.',
  Components: '| Layer | Technology | Role |\n|-------|------------|------|\n| Presentation | Angular 19 | Merchant portal SPA |\n| API | Express 4 / TypeScript | 46 REST modules |\n| Worker | Node worker process | MySQL queues, webhooks, email |\n| Data | MySQL 8 | 223 tables, ACID |\n| Cache/Lock | Redis 7 | Distributed locks, optional cache |',
}));

writeDoc(ARCH, 'High_Level_Architecture.md', archDoc('High Level Architecture', {
  ...archBase,
  Purpose: 'Describe major subsystems and their interactions at the solution level.',
  'Data Flow': `\`\`\`mermaid
flowchart LR
  User --> SPA[Angular SPA]
  SPA --> API[Express API]
  API --> DB[(MySQL)]
  API --> Redis[(Redis)]
  API --> Q[Queue Tables]
  Worker --> Q
  Worker --> DB
  Worker --> Ext[Webhooks / SMTP]
\`\`\``,
}));

writeDoc(ARCH, 'Low_Level_Architecture.md', archDoc('Low Level Architecture', {
  ...archBase,
  Purpose: 'Detail internal layering within API and worker processes.',
  Components: '**API layer:** routes → middleware (auth, CSRF, rate limit, RBAC) → controllers → services → repositories → mysql2 pool.\n\n**Worker layer:** worker-runner tick → claim queues (`FOR UPDATE`) → job-handlers → domain services.',
  Communication: 'In-process async/await; no message broker; shared `mysql2` connection pool per process.',
}));

writeDoc(ARCH, 'Architecture_Principles.md', archDoc('Architecture Principles', {
  ...archBase,
  Purpose: 'Governing principles for Merchant Pro engineering decisions.',
  Responsibilities: '| Principle | Application |\n|-----------|-------------|\n| Single source of truth | MySQL for transactional state |\n| Fail closed | Auth/authz deny by default |\n| Idempotent writes | Payment and checkout create paths |\n| Observable | Structured logs, metrics, health |\n| Modular monolith | 46 API modules, shared infra |',
}));

writeDoc(ARCH, 'Technology_Stack.md', archDoc('Technology Stack', {
  ...archBase,
  Purpose: 'Canonical technology choices for v1.0.0-rc1.',
  Components: '| Tier | Stack |\n|------|-------|\n| Frontend | Angular 19.2, Angular Material, RxJS 7 |\n| Backend | Node 20, Express 4.21, TypeScript 5.8 |\n| Database | MySQL 8.0 InnoDB utf8mb4 |\n| Cache | Redis 7 Alpine, ioredis 5 |\n| Auth | jsonwebtoken HS256, bcryptjs, otplib MFA |\n| Validation | Zod 4 |\n| Docs | swagger-jsdoc, swagger-ui-express |\n| Email | Nodemailer |\n| Container | Docker Compose |',
}));

writeDoc(ARCH, 'Architecture_Decision_Records.md', buildAdrDoc());

writeDoc(ARCH, 'Context_Diagram.md', archDoc('Context Diagram (C4)', {
  ...archBase,
  Purpose: 'C4 model levels 1–4 for system context.',
}, [c4Block(1, 'System Context', C4_CONTEXT_L1), c4Block(2, 'Extended Context', C4_CONTEXT_L2), c4Block(3, 'Context Flow', C4_CONTEXT_L3), c4Block(4, 'Trust Zones', C4_CONTEXT_L4)].join('\n\n')));

writeDoc(ARCH, 'Container_Diagram.md', archDoc('Container Diagram (C4)', {
  ...archBase,
  Purpose: 'C4 levels 1–4 for deployable containers.',
}, [c4Block(1, 'Containers', C4_CONTAINER_L1), c4Block(2, 'Docker Compose', C4_CONTAINER_L2), c4Block(3, 'API Internals', C4_CONTAINER_L3), c4Block(4, 'Persistent Volumes', C4_CONTAINER_L4)].join('\n\n')));

writeDoc(ARCH, 'Component_Diagram.md', archDoc('Component Diagram (C4)', {
  ...archBase,
  Purpose: 'C4 levels 1–4 for API components.',
}, [c4Block(1, 'Major Modules', C4_COMPONENT_L1), c4Block(2, 'Shared Middleware', C4_COMPONENT_L2), c4Block(3, 'Payment Module', C4_COMPONENT_L3), c4Block(4, 'Class View', C4_COMPONENT_L4)].join('\n\n')));

writeDoc(ARCH, 'Deployment_Architecture.md', archDoc('Deployment Architecture', {
  ...archBase,
  Purpose: COMMON.docker,
  Components: '| Service | Image | Port | Command |\n|---------|-------|------|--------|\n| mysql | mysql:8.0 | 3306 | init from master_database.sql |\n| redis | redis:7-alpine | 6379 | — |\n| backend | Backend_Fintech Dockerfile | 3000 | node dist/server.js |\n| worker | same image | — | node dist/worker.js |\n| frontend | Frontend_Fintech Dockerfile | 4200→80 | nginx static |',
  'Failure Handling': 'Docker healthchecks: mysqladmin ping, redis-cli ping, `/api/ready`, worker heartbeat script.',
}));

writeDoc(ARCH, 'Infrastructure_Architecture.md', archDoc('Infrastructure Architecture', {
  ...archBase,
  Purpose: 'Physical and virtual infrastructure supporting Merchant Pro.',
  Components: 'Volumes: `mysql_data`, `backend_uploads`, `backend_logs`. Network: bridge `fintech-network`. Init: `init: true` on backend/worker for signal handling.',
}));

writeDoc(ARCH, 'Network_Architecture.md', archDoc('Network Architecture', {
  ...archBase,
  Purpose: 'Network topology and port exposure.',
  Components: `\`\`\`mermaid
flowchart TB
  Internet --> FE[frontend:4200]
  Internet --> BE[backend:3000]
  FE --> BE
  BE --> MY[mysql:3306 internal]
  BE --> RD[redis:6379 internal]
  WK[worker] --> MY
  WK --> RD
\`\`\``,
  'Trust Boundaries': 'Only frontend and backend ports exposed to host; MySQL and Redis on internal bridge unless dev port mapping.',
}));

writeDoc(ARCH, 'Trust_Boundaries.md', archDoc('Trust Boundaries', {
  ...archBase,
  Purpose: 'Security zones and data classification boundaries.',
  Components: '| Zone | Assets | Controls |\n|------|--------|----------|\n| Public | Checkout pages, public payment links | Rate limit, CORS |\n| Authenticated | Merchant portal | JWT + CSRF + RBAC |\n| Internal | Worker, DB | Private network, no public routes |\n| Secret | JWT_SECRET, CONFIG_ENCRYPTION_KEY | Env vars, never in repo |',
}));

writeDoc(ARCH, 'Integration_Architecture.md', archDoc('Integration Architecture', {
  ...archBase,
  Purpose: 'External system integration patterns.',
  Components: '| Integration | Protocol | Direction |\n|-------------|----------|----------|\n| Payment gateway | HTTPS REST | Outbound |\n| Merchant webhooks | HTTPS POST + HMAC | Outbound |\n| SMTP | TLS | Outbound |\n| Developer API | REST `/api/v1` | Inbound |',
}));

writeDoc(ARCH, 'Security_Architecture.md', archDoc('Security Architecture', {
  ...archBase,
  Purpose: 'Defense-in-depth security controls.',
  Components: 'Helmet headers, CORS allowlist, CSRF double-submit, bcrypt passwords, MFA (TOTP/SMS), encrypted config values, audit logging. See [Authentication_Architecture.md](./Authentication_Architecture.md) and [Authorization_Architecture.md](./Authorization_Architecture.md).',
}));

writeDoc(ARCH, 'Authentication_Architecture.md', archDoc('Authentication Architecture', {
  ...archBase,
  Purpose: 'Identity verification: login, MFA, sessions, token lifecycle.',
  Components: 'Auth module: `AuthService`, `TokenService`, repositories for users/sessions/refresh_tokens. Access JWT HS256; refresh opaque token hashed SHA-256 in DB.',
  'Data Flow': `### Merchant Login\n\n${SEQ_MERCHANT_LOGIN}\n\n### Refresh Token Rotation\n\n${SEQ_REFRESH_TOKEN}`,
  'Cross References': `[01_Product/Modules/Authentication.md](${P1}/Modules/Authentication.md)`,
}));

writeDoc(ARCH, 'Authorization_Architecture.md', archDoc('Authorization Architecture', {
  ...archBase,
  Purpose: 'RBAC with 144 permissions, org and merchant scope caps.',
  Components: 'Middleware chain: authenticate → resolve organization → requirePermission(`resource:action`). Permissions defined in `permissions.ts`; roles in `roles` / `role_permissions` tables.',
  'Cross References': `[01_Product/Modules/Authorization.md](${P1}/Modules/Authorization.md)`,
}));

writeDoc(ARCH, 'Payment_Architecture.md', archDoc('Payment Architecture', {
  ...archBase,
  Purpose: 'Payment intent lifecycle: create, authorize, capture, settle, refund.',
  Components: '`PaymentEngineService`, `payment_intents`, `payment_orders`, `payment_timeline_events`, idempotency via `payment_idempotency_keys`.',
  'Data Flow': `### Authorize and Capture\n\n${SEQ_PAYMENT_AUTH_CAPTURE}\n\n### Refund\n\n${SEQ_REFUND}`,
  'Cross References': `[01_Product/Modules/Payments.md](${P1}/Modules/Payments.md) · [01_Product/Modules/Payment_Lifecycle.md](${P1}/Modules/Payment_Lifecycle.md)`,
}));

writeDoc(ARCH, 'Webhook_Architecture.md', archDoc('Webhook Architecture', {
  ...archBase,
  Purpose: 'Outbound event delivery to merchant endpoints.',
  Components: 'Tables: `webhook_subscriptions`, `webhook_delivery_queue`, `payment_webhook_deliveries`. Engine: `webhook-delivery.engine.ts` with HMAC signing.',
  'Data Flow': `### Webhook Delivery\n\n${SEQ_WEBHOOK_DELIVERY}`,
  'Cross References': `[01_Product/Modules/Webhooks.md](${P1}/Modules/Webhooks.md)`,
}));

writeDoc(ARCH, 'Worker_Architecture.md', archDoc('Worker Architecture', {
  ...archBase,
  Purpose: 'Background processing via custom MySQL queues — not BullMQ.',
  Components: '| Queue Table | Claim Pattern |\n|-------------|---------------|\n| background_jobs | FOR UPDATE → running |\n| retry_queue | FOR UPDATE → processing |\n| notification_deliveries | FOR UPDATE email pending |\n| webhook_delivery_queue | FOR UPDATE |\n| payment_webhook_deliveries | FOR UPDATE |',
  'Data Flow': `### Worker Retry\n\n${SEQ_WORKER_RETRY}`,
  'Failure Handling': 'Redis locks prevent duplicate processing; unknown job types marked failed and audited.',
  'Cross References': `[01_Product/Modules/Workers.md](${P1}/Modules/Workers.md) · [01_Product/Modules/Background_Jobs.md](${P1}/Modules/Background_Jobs.md)`,
}));

writeDoc(ARCH, 'Notification_Architecture.md', archDoc('Notification Architecture', {
  ...archBase,
  Purpose: 'In-app and email notification delivery.',
  Components: 'Create notification → `notification_deliveries` (in_app always, email if preference enabled) → worker SMTP via Nodemailer.',
  'Cross References': `[01_Product/Modules/Notifications.md](${P1}/Modules/Notifications.md)`,
}));

writeDoc(ARCH, 'Caching_Architecture.md', archDoc('Caching Architecture', {
  ...archBase,
  Purpose: 'Redis caching and lock strategy.',
  Components: 'Redis used for distributed locks (`lock:job:*`, `lock:webhook:*`), worker heartbeat, optional permission/session cache. No Redis-backed job queue.',
  Limitations: 'In-memory fallback when Redis disabled — single instance only.',
}));

writeDoc(ARCH, 'Monitoring_Architecture.md', archDoc('Monitoring Architecture', {
  ...archBase,
  Purpose: 'Health, metrics, and operational visibility.',
  Components: `${COMMON.health} Metrics: \`GET /api/v1/system/metrics\`. Admin status includes worker state and queue depths.`,
}));

writeDoc(ARCH, 'Logging_Architecture.md', archDoc('Logging Architecture', {
  ...archBase,
  Purpose: 'Structured application logging.',
  Components: 'Winston-style logger with request ID correlation (`X-Request-Id`). Logs to stdout and `backend_logs` volume in Docker.',
}));

writeDoc(ARCH, 'Availability_Architecture.md', archDoc('Availability Architecture', {
  ...archBase,
  Purpose: 'Uptime and dependency availability patterns.',
  Components: 'Liveness vs readiness separation: `/api/live` always 200 if process up; `/api/ready` checks DB + Redis; `/api/health` full component matrix.',
}));

writeDoc(ARCH, 'Scalability_Architecture.md', archDoc('Scalability Architecture', {
  ...archBase,
  Purpose: 'Horizontal and vertical scaling guidance.',
  Scalability: 'Scale API replicas behind load balancer; scale worker replicas with Redis locks; increase `WORKER_CONCURRENCY` and `WORKER_BATCH_SIZE`; index hot payment query paths.',
}));

writeDoc(ARCH, 'Disaster_Recovery.md', archDoc('Disaster Recovery', {
  ...archBase,
  Purpose: 'Backup, restore, and continuity planning.',
  Components: 'MySQL volume snapshots; rebuild schema via `Database_Fintech/scripts/build-master.ps1`; RPO/RTO targets in [03_Database/Recovery_Strategy.md](../03_Database/Recovery_Strategy.md).',
  'Failure Handling': 'Worker graceful shutdown on SIGTERM completes current tick before exit.',
}));

console.log('Architecture docs written:', 28);
