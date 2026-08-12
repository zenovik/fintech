# Repository Inventory

> **Phase 1 — Repository Audit** · v1.0.0-rc1 · Full categorized inventory · 2026-07-29

---

## Category Summary

| Category | Count | Primary paths |
|----------|------:|---------------|
| TypeScript source | 888 | Backend, Frontend, e2e, performance |
| Markdown documentation | 160 | docs/, Documentation/, */docs/ |
| SQL | 81 | Database_Fintech/ |
| JSON config | ~120 | package.json, tsconfig, angular, postman |
| YAML/YML | ~15 | .github/workflows, docker-compose |
| SCSS/CSS | ~200+ | Frontend components |
| HTML templates | ~160 | Angular templates |
| Shell/PowerShell scripts | ~20 | Database_Fintech/scripts, security |
| JavaScript (non-TS) | ~30 | performance/, security/, scripts |
| Dockerfiles | 2 | Backend, Frontend |
| GitHub workflows | 3 | .github/workflows/ |

**Total files (excl. node_modules, dist, .git):** ~1,516–1,765 depending on exclude rules

## Source Code by Package

| Package | Role | Key entry points |
|---------|------|------------------|
| Backend_Fintech | REST API + worker | server.ts, worker.ts, app.ts |
| Frontend_Fintech | SPA | main.ts, app.routes.ts |
| Database_Fintech | Schema | master_database.sql, structure_queries/ |
| e2e | Playwright tests | e2e/tests/*.spec.ts |
| performance | k6 tests | performance/tests/main.js |
| security | ZAP/audit | security/scripts/*.mjs |

## Configuration Files

| File | Purpose |
|------|---------|
| `.env.example` | Env template |
| `.env.production.example` | Production env template |
| `docker-compose.yml` | Container orchestration |
| `ecosystem.config.cjs` | PM2 |
| `playwright.config.ts` | E2E |
| `tsconfig.json` (×3) | TypeScript |
| `angular.json` | Angular CLI |
| `.prettierrc` | Formatting |
| `.editorconfig` | Editor defaults |

## Test Assets

| Type | Location | Count |
|------|----------|------:|
| Backend unit | Backend_Fintech/src/__tests__/*.test.ts | 3 |
| Backend integration | Backend_Fintech/src/__tests__/integration/*.integration.test.ts | 17 |
| E2E specs | e2e/tests/*.spec.ts | 16 |
| E2E page objects | e2e/pages/ | ~20 |
| k6 scenarios | performance/scenarios/ | 1 index |

## Database Assets

| Type | Count |
|------|------:|
| Tables (master SQL) | 223 |
| DDL files | 38 |
| Seed files (structure_queries) | 34 |
| Rollback scripts | 7 |
| Stored procedures | 5 |

## Documentation Assets

See [Documentation_Inventory.md](./Documentation_Inventory.md) — 160 MD files.

## Infrastructure Assets

| Asset | Path |
|-------|------|
| Deploy scripts | deploy/ |
| Postman collection | Postman/ |
| nginx config (FE docker) | Frontend_Fintech (Dockerfile context) |

## Traceability Matrix (sample)

| Inventory item | Code | Doc | DB |
|----------------|------|-----|-----|
| Payments | modules/payments/ | 01_Product/Modules/Payments.md | payment_intents |
| Auth | modules/auth/ | 01_Product/Modules/Authentication.md | users, refresh_tokens |
| Worker | shared/workers/ | 02_Architecture/Worker_Architecture.md | background_jobs |

## Cross References

- [Repository_Structure.md](./Repository_Structure.md)
- [Repository_Statistics.md](./Repository_Statistics.md)
