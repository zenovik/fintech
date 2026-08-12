#!/usr/bin/env node
import {
  DB, SD, writeDoc, dbDoc, sdDoc, P1,
  ER_IDENTITY, ER_MERCHANT, ER_PAYMENTS, ER_CHECKOUT, ER_REFUNDS,
  ER_SUBSCRIPTIONS, ER_INVOICES, ER_NOTIFICATIONS, ER_AUDIT, ER_CONFIG,
} from './generate-sprint2-docs.mjs';

// --- Database docs ---
writeDoc(DB, 'Database_Overview.md', dbDoc('Database Overview', {
  Purpose: 'Central data architecture for Merchant Pro (`fintech_db`). Single MySQL 8 schema with **223 tables**, **50** implementing soft delete via `deleted_at`.',
  Scope: 'Identity, merchants, payments, checkout, subscriptions, invoices, notifications, audit, configuration, reporting, and operational queue tables.',
  'Build Pipeline': 'Schema assembled by `Database_Fintech/scripts/build-master.ps1` from ordered files in `structure_queries/` → `master_database.sql`. Docker mounts this for init.',
  'Engine & Charset': 'InnoDB, utf8mb4_unicode_ci, BIGINT UNSIGNED surrogate keys, CHAR(36) UUIDs for external references.',
  Domains: '| Domain | Example Tables | Approx Tables |\n|--------|----------------|---------------|\n| Identity | users, refresh_tokens, user_sessions | 15+ |\n| Organization | organizations, organization_members | 12+ |\n| Merchant | merchants, outlets, merchant_users | 25+ |\n| Payments | payment_intents, payment_orders | 20+ |\n| Checkout | checkout_sessions, checkout_themes | 8+ |\n| Platform | audit_logs, feature_flags, background_jobs | 30+ |',
  'Cross References': `[ERD.md](./ERD.md) · [Data_Dictionary.md](./Data_Dictionary.md) · [01_Product](${P1}/README.md)`,
}));

writeDoc(DB, 'ERD.md', dbDoc('Entity Relationship Diagrams', {
  Purpose: 'Domain-scoped ER diagrams for major bounded contexts.',
  Identity: ER_IDENTITY,
  Merchant: ER_MERCHANT,
  Payments: ER_PAYMENTS,
  Checkout: ER_CHECKOUT,
  Refunds: ER_REFUNDS,
  Subscriptions: ER_SUBSCRIPTIONS,
  Invoices: ER_INVOICES,
  Notifications: ER_NOTIFICATIONS,
  Audit: ER_AUDIT,
  Configuration: ER_CONFIG,
  Notes: 'Full schema: `Database_Fintech/master_database.sql`. FK constraints enforce referential integrity with RESTRICT/SET NULL/CASCADE per relationship.',
}));

writeDoc(DB, 'Data_Model.md', dbDoc('Data Model', {
  Purpose: 'Logical grouping of 223 physical tables into domain aggregates.',
  'Identity Aggregate': 'users, auth tables (sessions, refresh_tokens, MFA), organization_members — authentication and membership.',
  'Merchant Aggregate': 'merchants, outlets, merchant_users, onboarding workflow — commercial entity lifecycle.',
  'Payment Aggregate': 'payment_orders → payment_intents → payment_sessions → transactions — monetary flow.',
  'Checkout Aggregate': 'checkout_sessions bound to payment_intents with themed presentation and event stream.',
  'Platform Aggregate': 'audit_logs, notifications, background_jobs, feature_flags — cross-cutting operational data.',
  'Queue Model': 'MySQL tables act as queues: background_jobs, retry_queue, webhook_delivery_queue, payment_webhook_deliveries, notification_deliveries.',
}));

writeDoc(DB, 'Relationships.md', dbDoc('Relationships', {
  Purpose: 'Foreign key patterns and cardinality rules.',
  'Core Patterns': '| Parent | Child | Cardinality | On Delete |\n|--------|-------|-------------|----------|\n| organizations | merchants | 1:N | RESTRICT |\n| merchants | payment_intents | 1:N | RESTRICT |\n| payment_intents | refunds | 1:N | RESTRICT |\n| users | audit_logs | 1:N | SET NULL |\n| checkout_sessions | payment_intents | N:1 | RESTRICT |',
  'Junction Tables': 'role_permissions, merchant_role_permissions, organization_members — many-to-many with composite PKs.',
  'Optional FKs': 'customer_id, order_id often NULL until associated; SET NULL on parent removal where historical record retained.',
}));

writeDoc(DB, 'Indexes.md', dbDoc('Indexes', {
  Purpose: 'Indexing strategy for query performance and uniqueness.',
  'Primary Keys': 'All tables use BIGINT UNSIGNED AUTO_INCREMENT PK except small lookup tables (TINYINT/INT).',
  'Unique Keys': 'uuid columns, business refs (merchant_code, intent_ref, checkout_ref), idempotency (merchant_id + idempotency_key).',
  'Composite Indexes': 'Status + created_at on high-volume tables (payment_intents, checkout_sessions, audit_logs).',
  'Soft Delete': 'deleted_at indexed where present (50 tables) for filtered queries `WHERE deleted_at IS NULL`.',
}));

writeDoc(DB, 'Constraints.md', dbDoc('Constraints', {
  Purpose: 'Integrity rules beyond primary keys.',
  'Foreign Keys': 'Enforced at DB level via CONSTRAINT fk_* — prevents orphan payment intents, invalid merchant references.',
  'ENUM Columns': 'Status fields use ENUM for state machines (payment intent status, checkout status, refund status).',
  'CHECK / Defaults': 'DECIMAL(18,2) for monetary amounts; NOT NULL on created_at; DEFAULT CURRENT_TIMESTAMP.',
  Uniqueness: 'Email on users; composite unique on role_permissions.',
}));

writeDoc(DB, 'Naming_Standards.md', dbDoc('Naming Standards', {
  Purpose: 'Consistent naming across 223 tables.',
  Tables: 'snake_case plural nouns: `payment_intents`, `checkout_session_events`.',
  Columns: 'snake_case; `_id` suffix for FKs; `_at` for timestamps; `_hash` for stored digests.',
  Keys: 'uk_* unique, idx_* index, fk_* foreign key constraints.',
  'Reference Codes': 'Human-readable refs: intent_ref, checkout_ref, merchant_code — separate from uuid.',
}));

writeDoc(DB, 'Migration_Strategy.md', dbDoc('Migration Strategy', {
  Purpose: 'Schema evolution and deployment.',
  'Build Process': '1. Edit/add SQL in `Database_Fintech/structure_queries/`. 2. Run `build-master.ps1`. 3. Commit `master_database.sql`. 4. Docker init or manual apply for existing envs.',
  'Versioning': 'Numbered migration files (066_, 075_, etc.) appended to build order; no flyway/liquibase in rc1.',
  'Zero-Downtime': 'Additive changes preferred; destructive changes require maintenance window and backup.',
  Rollback: 'Restore from backup or revert git commit and rebuild master SQL.',
}));

writeDoc(DB, 'Soft_Delete_Strategy.md', dbDoc('Soft Delete Strategy', {
  Purpose: 'Logical deletion via `deleted_at` DATETIME NULL.',
  Coverage: '**50 tables** include `deleted_at` — primarily users, merchants, organizations, customers, and configurable entities.',
  'Query Pattern': 'Application repositories default filter `deleted_at IS NULL`; admin restore sets deleted_at to NULL.',
  'Unique Constraints': 'Soft-deleted rows may block re-create unless unique keys include deleted_at or use new uuid.',
  'Cross References': `[01_Product/Business_Rules.md](${P1}/Business_Rules.md) for business deletion policies.`,
}));

writeDoc(DB, 'Archival_Strategy.md', dbDoc('Archival Strategy', {
  Purpose: 'Long-term retention and cold storage.',
  'Organization Archival': 'organizations.archived_at marks dormant tenants; related merchants may be suspended.',
  'Audit Retention': 'audit_logs retained per compliance config; export via audit:export permission.',
  'Payment History': 'Immutable timeline events; no hard delete of captured payments.',
  Future: 'Partition audit_logs and payment_timeline_events by month; archive to object storage.',
}));

writeDoc(DB, 'Backup_Strategy.md', dbDoc('Backup Strategy', {
  Purpose: 'Data protection for fintech_db.',
  'Docker Volume': 'mysql_data volume — snapshot at hypervisor or `mysqldump` scheduled job.',
  Frequency: 'Daily full backup minimum for production; binlog for point-in-time where enabled.',
  Scope: 'Full schema + data; separate backup of backend_uploads volume.',
  Verification: 'Periodic restore to staging and run integration test suite.',
}));

writeDoc(DB, 'Recovery_Strategy.md', dbDoc('Recovery Strategy', {
  Purpose: 'RPO/RTO targets and restore procedures.',
  RPO: 'Target ≤ 24 hours for rc1 single-node (daily backup); ≤ 1 hour with binlog in production hardening.',
  RTO: 'Target ≤ 4 hours: restore dump, restart compose stack, verify `/api/ready`.',
  Procedure: '1. Stop traffic. 2. Restore MySQL volume or import dump. 3. Start mysql → redis → backend → worker → frontend. 4. Smoke test health endpoints.',
}));

writeDoc(DB, 'Partitioning_Strategy.md', dbDoc('Partitioning Strategy', {
  Purpose: 'Future horizontal partitioning plan.',
  Candidates: 'audit_logs, payment_timeline_events, login_attempts, webhook delivery history — time-series growth.',
  Approach: 'RANGE partitioning by YEAR-MONTH on created_at when row count exceeds operational threshold.',
  Current: 'No partitioning in rc1; indexes sufficient for UAT volumes.',
}));

writeDoc(DB, 'Performance_Considerations.md', dbDoc('Performance Considerations', {
  Purpose: 'Query optimization and connection management.',
  'Connection Pool': 'mysql2 pool per API/worker process; avoid long transactions blocking queue claims.',
  'Hot Queries': 'Payment list by merchant_id + status; checkout expiry sweep; worker queue claims with LIMIT + FOR UPDATE.',
  'N+1 Avoidance': 'Repository layer batch queries; JOIN for list endpoints where needed.',
  Caching: 'Redis for permission resolution and feature flags — not primary read path for payments.',
}));

writeDoc(DB, 'Data_Dictionary.md', dbDoc('Data Dictionary', {
  Purpose: 'Major entity reference with lifecycle and PII classification.',
  users: '**Purpose:** Platform identity. **Relationships:** organization_members, user_sessions, refresh_tokens. **Lifecycle:** pending → active → locked/inactive; soft delete. **PII:** email, phone, name — HIGH.',
  organizations: '**Purpose:** Tenant root. **Relationships:** merchants, organization_members, organization_api_keys. **Lifecycle:** active/archived. **PII:** billing contacts — MEDIUM.',
  merchants: '**Purpose:** Commercial entity accepting payments. **Relationships:** payment_intents, checkout_sessions, outlets. **Lifecycle:** pending → active → suspended. **PII:** legal_name, registration — MEDIUM.',
  payment_intents: '**Purpose:** Core payment state machine. **Relationships:** payment_orders, checkout_sessions, refunds, timeline events. **Lifecycle:** pending → authorized → captured → settled/refunded. **PII:** metadata may contain customer refs — LOW direct.',
  checkout_sessions: '**Purpose:** Hosted checkout context. **Relationships:** payment_intents, checkout_themes, events. **Lifecycle:** open → complete/expired/abandoned. **PII:** customer_email, billing_address JSON — HIGH.',
  refresh_tokens: '**Purpose:** Session continuity. **Relationships:** users. **Lifecycle:** issued → rotated → revoked/expired. **PII:** token_hash only — no plaintext.',
  background_jobs: '**Purpose:** Async work queue. **Lifecycle:** queued → running → completed/failed. **PII:** payload JSON may reference user email — context dependent.',
  audit_logs: '**Purpose:** Compliance trail. **Relationships:** users, organizations, merchants. **Lifecycle:** append-only. **PII:** actor identity, IP — MEDIUM.',
  feature_flags: '**Purpose:** Runtime toggles per org. **Lifecycle:** created → enabled/disabled. **PII:** none.',
  webhook_subscriptions: '**Purpose:** Merchant endpoint registration. **PII:** URL may be merchant-controlled — LOW.',
}));

console.log('Database docs written:', 15);

// --- Solution Design docs ---
writeDoc(SD, 'Solution_Overview.md', sdDoc('Solution Overview', {
  Purpose: '4+1 architectural views for Merchant Pro technical solution.',
  'Logical View': '[Logical_View.md](./Logical_View.md) — API module layering.',
  'Process View': '[Runtime_View.md](./Runtime_View.md) + [Concurrency_Model.md](./Concurrency_Model.md).',
  'Development View': 'Monorepo: Frontend_Fintech, Backend_Fintech, Database_Fintech.',
  'Physical View': '[Physical_View.md](./Physical_View.md) — Docker containers.',
  Scenarios: '[Module_Interaction.md](./Module_Interaction.md) — auth, payment, webhook flows.',
  'Product Link': `[01_Product/Product_Functional_Specification.md](${P1}/Product_Functional_Specification.md)`,
}));

writeDoc(SD, 'Module_Interaction.md', sdDoc('Module Interaction', {
  Purpose: 'Inter-module communication among core platform modules.',
  Modules: 'Auth, Authorization, Merchant, Payment, Checkout, Refund, Webhook, Notification, Workers, Reports, Audit, Configuration.',
  Diagram: `\`\`\`mermaid
flowchart TB
  Auth --> Authorization
  Authorization --> Merchant
  Authorization --> Payment
  Authorization --> Checkout
  Payment --> Refund
  Payment --> Webhook
  Payment --> Audit
  Checkout --> Payment
  Webhook --> Workers
  Notification --> Workers
  Payment --> Notification
  Configuration --> Payment
  Configuration --> FeatureFlags[Feature Flags]
  Reports --> Payment
  Audit --> Reports
\`\`\``,
  'Auth → Payment': 'JWT carries organizationId and merchant scope; PaymentEngineService validates merchant access.',
  'Payment → Webhook → Worker': 'State change inserts delivery row; worker claims and POSTs HMAC payload.',
  'Configuration': 'Settings module and feature_flags table gate module behavior at runtime.',
}));

writeDoc(SD, 'Runtime_View.md', sdDoc('Runtime View', {
  Purpose: 'Processes at runtime.',
  Processes: '| Process | Entry | Role |\n|---------|-------|------|\n| API Server | dist/server.js | HTTP request handling |\n| Worker | dist/worker.js | Queue polling |\n| MySQL | mysqld | Persistence |\n| Redis | redis-server | Locks/cache |',
  'Request Lifecycle': 'Express middleware pipeline → route handler → service → DB → JSON response.',
  'Worker Lifecycle': 'Poll interval tick → parallel queue claims → handler execution → metrics update → heartbeat Redis key.',
}));

writeDoc(SD, 'Deployment_View.md', sdDoc('Deployment View', {
  Purpose: 'Mapping of software to Docker Compose deployment.',
  Stack: 'Five services on fintech-network; backend health gates worker and frontend startup.',
  'Environment': 'Secrets via .env: JWT_SECRET, MYSQL_PASSWORD, CONFIG_ENCRYPTION_KEY, CORS_ORIGIN.',
  Artifacts: 'Backend/Frontend built via Dockerfiles; DB seeded from master_database.sql on first mysql start.',
}));

writeDoc(SD, 'Operational_View.md', sdDoc('Operational View', {
  Purpose: 'Operations, monitoring, and admin workflows.',
  Health: 'GET /api/live, /api/ready, /api/health — see Observability_Model.',
  Admin: 'System module: metrics, admin status, worker queue depths.',
  'Log Access': 'backend_logs volume; structured JSON with requestId correlation.',
}));

writeDoc(SD, 'Logical_View.md', sdDoc('Logical View', {
  Purpose: 'Layered structure of Backend_Fintech.',
  Layers: '| Layer | Responsibility |\n|-------|----------------|\n| routes | HTTP mapping, Swagger tags |\n| controllers | Request/response, status codes |\n| services | Business logic, transactions |\n| repositories | SQL, row mapping |\n| shared | middleware, workers, redis, logger |',
  Modules: '46 domain modules registered in app.ts — each exports routes index.',
}));

writeDoc(SD, 'Physical_View.md', sdDoc('Physical View', {
  Purpose: 'Hardware and container mapping.',
  'Single Host': 'All compose services on one VM for UAT; production may split MySQL to managed service.',
  Ports: 'Frontend 4200, Backend 3000, MySQL 3306, Redis 6379 (host-mapped in dev).',
  Storage: 'Persistent volumes for mysql_data, uploads, logs.',
}));

writeDoc(SD, 'Concurrency_Model.md', sdDoc('Concurrency Model', {
  Purpose: 'Parallel execution model.',
  API: 'Node.js single-threaded event loop; concurrent requests via async I/O; pool connections bounded.',
  Worker: 'WORKER_CONCURRENCY parallel tasks per tick; queue claims serialized per table via FOR UPDATE transactions.',
  Locks: 'Redis distributed locks for cross-instance duplicate prevention.',
}));

writeDoc(SD, 'Threading_and_Async_Model.md', sdDoc('Threading and Async Model', {
  Purpose: 'Node.js concurrency characteristics.',
  Model: 'No worker threads for business logic; async/await throughout; Promise.all for independent health checks.',
  'Blocking Avoidance': 'No sync fs in hot path; PDF generation and email async.',
  'Signal Handling': 'Worker SIGTERM graceful shutdown completes current tick.',
}));

writeDoc(SD, 'Transaction_Model.md', sdDoc('Transaction Model', {
  Purpose: 'Database transaction boundaries.',
  Pattern: 'Services begin transaction on mysql2 connection for multi-table writes (payment create + timeline + idempotency).',
  'Queue Claims': 'Short transactions: SELECT FOR UPDATE → UPDATE status → COMMIT before handler execution.',
  Isolation: 'Default REPEATABLE READ (InnoDB); row locks on payment_intents during refund.',
}));

writeDoc(SD, 'Consistency_Model.md', sdDoc('Consistency Model', {
  Purpose: 'Consistency guarantees across components.',
  'Strong Consistency': 'Payment state, balances, refund amounts — single MySQL transaction.',
  'Eventual Consistency': 'Webhook delivery, email notifications — at-least-once via retry_queue.',
  Idempotency: 'Payment create returns cached response for duplicate Idempotency-Key.',
}));

writeDoc(SD, 'Error_Handling_Model.md', sdDoc('Error Handling Model', {
  Purpose: 'Unified error taxonomy and HTTP mapping.',
  Taxonomy: '| Category | Code Examples | HTTP |\n|----------|---------------|------|\n| Business | INSUFFICIENT_BALANCE, INVALID_STATE | 409/422 |\n| Validation | VALIDATION_ERROR (Zod) | 400 |\n| Auth | UNAUTHORIZED | 401 |\n| Authorization | FORBIDDEN | 403 |\n| Infrastructure | INTERNAL_ERROR | 500 |\n| Database | DUPLICATE (ER_DUP_ENTRY) | 409 |\n| Network | WEBHOOK_TIMEOUT | 502 (worker retry) |\n| Timeout | GATEWAY_TIMEOUT | 504 |\n| Retry | retry_queue backoff | N/A (async) |',
  Handler: 'error-handler.middleware.ts maps AppError, ZodError, MySQL errors to JSON `{ success, message, code, requestId }`.',
}));

writeDoc(SD, 'Validation_Model.md', sdDoc('Validation Model', {
  Purpose: 'Input validation at API boundary.',
  Zod: 'Module dto/*.ts schemas; parse in controllers or middleware.',
  'Sanitization': 'Email normalization, amount precision DECIMAL(18,2), enum validation against DB enums.',
  'CSRF': 'Mutating requests require valid CSRF token except exempt paths (health, public checkout).',
}));

writeDoc(SD, 'Integration_Model.md', sdDoc('Integration Model', {
  Purpose: 'External integration patterns.',
  REST: 'Inbound developer API with API keys and JWT.',
  Webhooks: 'Outbound HMAC-signed POST with retry.',
  Email: 'SMTP via Nodemailer for invoices, password reset, notifications.',
  Gateway: 'Payment gateway abstraction in payment-engine for authorize/capture.',
}));

writeDoc(SD, 'API_Design.md', sdDoc('API Design', {
  Purpose: 'REST API conventions.',
  Versioning: 'Prefix `/api/v1` for business routes; `/api/live|ready|health` unversioned.',
  Format: 'JSON request/response; `{ success, data }` or error envelope.',
  Auth: 'Bearer JWT in Authorization header; refresh via cookie or body.',
  Documentation: 'Swagger UI on API process; 46 modules tagged by domain.',
  Idempotency: 'Idempotency-Key header on payment and checkout create.',
}));

writeDoc(SD, 'Security_Model.md', sdDoc('Security Model', {
  Purpose: 'Application security design.',
  Layers: 'Transport TLS → Helmet → CORS → Rate limit → CSRF → JWT auth → RBAC → audit.',
  Secrets: 'Env-validated at startup (validate-env.ts); CONFIG_ENCRYPTION_KEY for sensitive settings.',
  'Cross Reference': `[02_Architecture/Security_Architecture.md](../02_Architecture/Security_Architecture.md)`,
}));

writeDoc(SD, 'Configuration_Model.md', sdDoc('Configuration Model', {
  Purpose: 'Configuration sources and precedence.',
  Env: '.env / Docker environment — DB_*, JWT_*, REDIS_*, WORKER_* variables.',
  Database: 'platform_settings, organization_preferences, feature_flags override runtime behavior.',
  Validation: 'validate-env.ts fails fast on missing required secrets in production.',
}));

writeDoc(SD, 'Observability_Model.md', sdDoc('Observability Model', {
  Purpose: 'Logs, metrics, traces, health.',
  Health: '| Endpoint | Use |\n|----------|-----|\n| /api/live | Process alive |\n| /api/ready | DB + Redis ready |\n| /api/health | Full dependency matrix |',
  Metrics: 'metrics.registry.ts counters/histograms; exposed at /api/v1/system/metrics.',
  Logging: 'Structured logs with requestId, userId, organizationId on errors.',
}));

writeDoc(SD, 'Performance_Model.md', sdDoc('Performance Model', {
  Purpose: 'Throughput and latency considerations.',
  API: 'compression middleware; connection pool sizing; index-backed list queries.',
  Worker: 'Batch claim (WORKER_BATCH_SIZE); concurrent handlers (WORKER_CONCURRENCY); poll interval tuning.',
  Frontend: 'Angular production build served by nginx; lazy-loaded feature modules.',
  'NFR Link': `[01_Product/Non_Functional_Requirements.md](${P1}/Non_Functional_Requirements.md)`,
}));

console.log('Solution design docs written:', 19);
