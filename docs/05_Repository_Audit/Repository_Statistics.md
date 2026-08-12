# Repository Statistics

> **Phase 1 — Repository Audit** · v1.0.0-rc1 · Evidence from repository scan · 2026-07-28

## Cross References

| Layer | Path |
|-------|------|
| Product | [01_Product](../01_Product/README.md) |
| Architecture | [02_Architecture](../02_Architecture/README.md) |
| Database | [03_Database](../03_Database/README.md) |
| Solution Design | [04_Solution_Design](../04_Solution_Design/README.md) |
| Repository Audit | [05_Repository_Audit](../05_Repository_Audit/README.md) |

---



## Scan Method

Recursive file walk from repository root excluding `node_modules`, `.git`, `dist`, `coverage`, `.angular`, `playwright-report`, `test-results`.

## File Metrics

| Metric | Count | Evidence |
|--------|------:|----------|
| Total files (excl. exclusions) | 1765 | `generate-phase1-audit.mjs` walk |
| TypeScript files | 888 | `*.ts` |
| TypeScript lines (est.) | 65132 | line count |
| Markdown files | 160 | `*.md` |
| SQL files | 81 | `*.sql` |
| JSON files | 22 | extension count |
| YAML/YML files | 4 | extension count |

## Application Metrics

| Metric | Count | Evidence |
|--------|------:|----------|
| MySQL tables | 223 | `Database_Fintech/master_database.sql` `CREATE TABLE` |
| Tables with `deleted_at` references | 76 | grep `deleted_at` in master_database.sql |
| Stored procedures | 5 | `CREATE PROCEDURE` in master SQL |
| Views | 0 | `CREATE VIEW` (0 in schema; docs placeholder) |
| Triggers | 0 | `CREATE TRIGGER` |
| Backend controllers | 47 | `**/*.controller.ts` under Backend_Fintech |
| Backend services | 67 | `**/*.service.ts` under Backend_Fintech/src |
| Backend repositories | 61 | `**/*.repository.ts` |
| Backend route files | 48 | `**/*.routes.ts` + app.ts |
| HTTP endpoints (router-defined) | 562 | static analysis of route files |
| App health endpoints | 3 | `/api/live`, `/api/ready`, `/api/health` in app.ts |
| Auth endpoints | 16 | `auth.routes.ts` |
| Middleware modules | 13 | `*middleware*.ts` |
| API modules (domain folders) | 46 | `Backend_Fintech/src/app/modules/*` |
| Frontend components | 153 | `**/*.component.ts` |
| Frontend services | 67 | `**/*.service.ts` in Frontend |
| Frontend guards | 3 | auth.guard, guest.guard, permission.guard |
| Frontend interceptors | 1 | auth.interceptor.ts |
| Frontend lazy route bundles | 37 | `loadChildren` in app.routes.ts |
| NgModules | 0 | no `*.module.ts` |
| Backend unit test files | 3 | `src/__tests__/*.test.ts` (non-integration) |
| Backend integration test files | 17 | `*.integration.test.ts` |
| E2E spec files | 16 | `e2e/tests/*.spec.ts` (+ auth.setup.ts) |
| E2E test cases (test()) | 66 | grep `test(` in e2e/tests |
| Docker Compose services | 5 | docker-compose.yml |
| Dockerfiles | 2 | Backend + Frontend |
| GitHub workflows | 3 | ci.yml, security.yml, performance.yml |
| Background job types (handled) | 4 | job-handlers.ts switch |
| Permissions (RBAC) | 144 | permissions.ts constant array |

## LOC Estimate

| Area | Lines (est.) |
|------|-------------|
| TypeScript (all) | 65132 |
| SQL | 258853 |
| Markdown | 17804 |
| **Total source (TS+SQL+MD)** | 341789 |
