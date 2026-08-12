# Repository Structure

> **Phase 1 — Repository Audit** · v1.0.0-rc1 · Evidence from repository scan · 2026-07-29

## Cross References

| Layer | Path |
|-------|------|
| Product | [01_Product](../01_Product/README.md) |
| Architecture | [02_Architecture](../02_Architecture/README.md) |

---

## Top-Level Layout

| Path | Type | Purpose (verified) |
|------|------|-------------------|
| `Backend_Fintech/` | Application | Express/TypeScript REST API + worker |
| `Frontend_Fintech/` | Application | Angular 19 SPA |
| `Database_Fintech/` | Data | DDL, seeds, `master_database.sql` (223 tables) |
| `docs/` | Documentation | Enterprise docs (01–05) |
| `Documentation/` | Documentation | User/admin/release guides |
| `e2e/` | Tests | Playwright E2E (16 spec files) |
| `performance/` | Tests | k6 performance scripts |
| `security/` | Security | ZAP scripts, audit reports |
| `deploy/` | Infrastructure | Deployment assets |
| `Design/` | Design | Design artifacts |
| `Postman/` | API | Postman collection |
| `scripts/` | Tooling | Root-level scripts |
| `validation-scripts/` | Tooling | Validation utilities |
| `.github/workflows/` | CI/CD | GitHub Actions (3 workflows) |
| `docker-compose.yml` | Infrastructure | Local/production compose stack |
| `ecosystem.config.cjs` | Infrastructure | PM2 process config |
| `playwright.config.ts` | Tests | Playwright configuration |

## Backend_Fintech Structure

```
Backend_Fintech/
├── src/
│   ├── server.ts              # API entry
│   ├── worker.ts              # Worker entry
│   └── app/
│       ├── app.ts             # Express app + route mounts
│       ├── config/            # env, http-security
│       ├── database/          # MySQL pool
│       ├── modules/           # 46 domain modules
│       ├── shared/            # middleware, workers, email, cache
│       └── swagger/           # OpenAPI setup
├── scripts/                   # worker-healthcheck.js, etc.
├── docs/                      # Backend runbooks
└── Dockerfile
```

**Evidence:** `Backend_Fintech/src/app/app.ts` registers 48 route mounts under `/api`.

## Frontend_Fintech Structure

```
Frontend_Fintech/
├── src/
│   ├── main.ts
│   ├── app/
│   │   ├── core/              # auth, layout, navigation, interceptors
│   │   ├── features/          # 41 feature folders (38 with routes)
│   │   ├── routing/app.routes.ts
│   │   └── shared/            # UI, AI widgets, utils
│   └── environments/
├── public/
└── Dockerfile                 # nginx production image
```

**Evidence:** No `*.module.ts` files — standalone components only (0 NgModules).

## Database_Fintech Structure

```
Database_Fintech/
├── master_database.sql        # Built artifact (223 tables)
├── structure_queries/         # 38 DDL + 34 seed SQL files
├── rollback_scripts/          # 7 drop scripts
├── scripts/
│   ├── build-master.ps1       # Concatenates DDL + seeds
│   ├── setup-database.ps1/sh
│   └── generate-*.mjs         # Seed generators
└── docs/
```

## docs/ Enterprise Documentation

| Folder | Files | Purpose |
|--------|------:|---------|
| `01_Product/` | 43 | Business/product specs |
| `02_Architecture/` | 28 | C4, ADRs, domain architecture |
| `03_Database/` | 16 | ERD, data dictionary |
| `04_Solution_Design/` | 20 | Runtime, error, observability models |
| `05_Repository_Audit/` | 30 | This audit (Phase 1) |

## Monorepo Workspace

**Evidence:** Root `package.json` workspaces: `Frontend_Fintech`, `Backend_Fintech`.

| Script | Purpose |
|--------|---------|
| `npm run dev` | concurrently frontend + backend |
| `npm run build` | build both workspaces |
| `npm run db:build` | regenerate master_database.sql |
| `npm run test:e2e` | Playwright |
| `npm run perf:*` | k6 profiles |
| `npm run security:*` | dependency audit + ZAP |
