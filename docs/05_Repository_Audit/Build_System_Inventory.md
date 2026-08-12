# Build System Inventory

> **Phase 1 — Repository Audit** · v1.0.0-rc1 · 2026-07-29

---

## Root Monorepo Scripts

| Script | Command | Output |
|--------|---------|--------|
| `build` | BE build + FE build | `Backend_Fintech/dist`, `Frontend_Fintech/dist/frontend-fintech` |
| `build:prod` | BE + FE `--configuration=production` | Production bundles |
| `db:build` | build-master.ps1 | `Database_Fintech/master_database.sql` |
| `db:validate` | validate-database-build.ps1 | validation exit code |
| `db:setup` | setup-database.ps1/sh | DB import |

## Backend Build

| Item | Value |
|------|-------|
| Compiler | TypeScript ^5.8.3 |
| Build cmd | `tsc` (see Backend package.json `build`) |
| Dev cmd | `tsx watch src/server.ts` |
| Output | `dist/` |
| Entry points | `dist/server.js`, `dist/worker.js` |

## Frontend Build

| Item | Value |
|------|-------|
| Builder | @angular-devkit/build-angular:application |
| Output | `dist/frontend-fintech` |
| Production | file replacement environment.prod.ts |
| Budgets | initial 500kB warn / 1MB error |
| Dev server | ng serve + proxy.conf.json |

## Database Build

| Script | Purpose |
|--------|---------|
| `build-master.ps1` | Concatenate 38 DDL + 31 seed files |
| `validate-database-build.ps1` | Validate artifact |
| `generate-enterprise-seed.mjs` | Generate seed data |
| `generate-enterprise-polish.mjs` | Polish seed |
| `generate-hierarchy-demo.mjs` | Hierarchy demo |

## Docker Build

| Command | Result |
|---------|--------|
| `npm run docker:build` | docker compose build all images |
| `npm run docker:up` | Start stack |

## Code Quality

| Tool | Scope |
|------|-------|
| Prettier | TS, JS, JSON, SCSS, HTML, MD, YAML |
| ESLint | Backend only |
| FE lint | Prettier check (package.json) |

## Cross References

- [CI_CD_Inventory.md](./CI_CD_Inventory.md)
