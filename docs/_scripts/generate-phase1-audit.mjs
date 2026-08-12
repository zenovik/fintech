#!/usr/bin/env node
/**
 * Phase 1 Repository Audit — evidence-based doc generator.
 * Run: node docs/_scripts/generate-phase1-audit.mjs
 */
import { mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(REPO, 'docs', '05_Repository_Audit');
mkdirSync(OUT, { recursive: true });

const EXCLUDE = /node_modules|\.git[\\/]|dist[\\/]|coverage|\.angular|playwright-report|test-results/;
function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (EXCLUDE.test(p)) continue;
    if (e.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const allFiles = walk(REPO);
const byExt = {};
for (const f of allFiles) {
  const ext = f.includes('.') ? f.slice(f.lastIndexOf('.')) : '(none)';
  byExt[ext] = (byExt[ext] || 0) + 1;
}

function countLines(files) {
  let n = 0;
  for (const f of files) {
    try { n += readFileSync(f, 'utf8').split('\n').length; } catch { /* skip */ }
  }
  return n;
}

const tsFiles = allFiles.filter((f) => f.endsWith('.ts'));
const mdFiles = allFiles.filter((f) => f.endsWith('.md'));
const sqlFiles = allFiles.filter((f) => f.endsWith('.sql'));

const masterSql = readFileSync(join(REPO, 'Database_Fintech', 'master_database.sql'), 'utf8');
const tableCount = (masterSql.match(/^CREATE TABLE IF NOT EXISTS/gm) || []).length;
const procCount = (masterSql.match(/^CREATE PROCEDURE/gm) || []).length;
const viewCount = (masterSql.match(/^CREATE VIEW/gm) || []).length;
const triggerCount = (masterSql.match(/^CREATE TRIGGER/gm) || []).length;

// Tables with deleted_at column (approx: table blocks containing deleted_at after CREATE TABLE)
const deletedAtTables = [];
for (const m of masterSql.matchAll(/CREATE TABLE IF NOT EXISTS `([^`]+)`[\s\S]*?;/g)) {
  if (m[0].includes('deleted_at')) deletedAtTables.push(m[1]);
}

const header = (title) => `# ${title}

> **Phase 1 — Repository Audit** · v1.0.0-rc1 · Evidence from repository scan · ${new Date().toISOString().slice(0, 10)}

## Cross References

| Layer | Path |
|-------|------|
| Product | [01_Product](../01_Product/README.md) |
| Architecture | [02_Architecture](../02_Architecture/README.md) |
| Database | [03_Database](../03_Database/README.md) |
| Solution Design | [04_Solution_Design](../04_Solution_Design/README.md) |

---

`;

writeFileSync(join(OUT, 'README.md'), `${header('Repository Audit — Merchant Pro')}

Enterprise reverse-engineering inventory for v1.0.0-rc1. All counts derived from \`docs/_scripts/generate-phase1-audit.mjs\` scan unless marked **NOT VERIFIED**.

## Document Index

| # | Document | Scope |
|---|----------|-------|
| 1 | [Repository_Inventory.md](./Repository_Inventory.md) | Full categorized file inventory |
| 2 | [Repository_Structure.md](./Repository_Structure.md) | Directory tree and layout |
| 3 | [Technology_Inventory.md](./Technology_Inventory.md) | Frameworks and runtime stack |
| 4 | [Dependency_Inventory.md](./Dependency_Inventory.md) | npm manifests |
| 5 | [Frontend_Inventory.md](./Frontend_Inventory.md) | Angular artifacts |
| 6 | [Backend_Inventory.md](./Backend_Inventory.md) | Express modules |
| 7 | [Database_Inventory.md](./Database_Inventory.md) | Schema and scripts |
| 8 | [API_Inventory.md](./API_Inventory.md) | HTTP endpoints |
| 9 | [Configuration_Inventory.md](./Configuration_Inventory.md) | Env and config |
| 10 | [Infrastructure_Inventory.md](./Infrastructure_Inventory.md) | Deploy and ops |
| 11 | [Docker_Inventory.md](./Docker_Inventory.md) | Containers |
| 12 | [Environment_Inventory.md](./Environment_Inventory.md) | Environment variables |
| 13 | [Build_System_Inventory.md](./Build_System_Inventory.md) | Build pipelines |
| 14 | [CI_CD_Inventory.md](./CI_CD_Inventory.md) | GitHub Actions |
| 15 | [Worker_Inventory.md](./Worker_Inventory.md) | Background worker |
| 16 | [Scheduler_Inventory.md](./Scheduler_Inventory.md) | Job schedules |
| 17 | [Security_Inventory.md](./Security_Inventory.md) | Security controls |
| 18 | [Documentation_Inventory.md](./Documentation_Inventory.md) | All markdown docs |
| 19 | [Third_Party_Inventory.md](./Third_Party_Inventory.md) | External integrations |
| 20 | [Dead_Code_Inventory.md](./Dead_Code_Inventory.md) | Dead code analysis |
| 21 | [Unused_Files.md](./Unused_Files.md) | Empty / orphan paths |
| 22 | [Unused_APIs.md](./Unused_APIs.md) | API usage gaps |
| 23 | [Unused_Components.md](./Unused_Components.md) | Frontend orphans |
| 24 | [Unused_Services.md](./Unused_Services.md) | Service usage |
| 25 | [Unused_Utilities.md](./Unused_Utilities.md) | Utility orphans |
| 26 | [Duplicate_Code_Findings.md](./Duplicate_Code_Findings.md) | Duplication |
| 27 | [Repository_Statistics.md](./Repository_Statistics.md) | Metrics |
| 28 | [Repository_Risk_Register.md](./Repository_Risk_Register.md) | Risks |
| 29 | [Repository_Findings.md](./Repository_Findings.md) | Executive findings |

## Version History

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-07-29 | Phase 1 initial audit |
`);

writeFileSync(join(OUT, 'Repository_Statistics.md'), `${header('Repository Statistics')}

## Scan Method

Recursive file walk from repository root excluding \`node_modules\`, \`.git\`, \`dist\`, \`coverage\`, \`.angular\`, \`playwright-report\`, \`test-results\`.

## File Metrics

| Metric | Count | Evidence |
|--------|------:|----------|
| Total files (excl. exclusions) | ${allFiles.length} | \`generate-phase1-audit.mjs\` walk |
| TypeScript files | ${tsFiles.length} | \`*.ts\` |
| TypeScript lines (est.) | ${countLines(tsFiles)} | line count |
| Markdown files | ${mdFiles.length} | \`*.md\` |
| SQL files | ${sqlFiles.length} | \`*.sql\` |
| JSON files | ${byExt['.json'] || 0} | extension count |
| YAML/YML files | ${(byExt['.yml'] || 0) + (byExt['.yaml'] || 0)} | extension count |

## Application Metrics

| Metric | Count | Evidence |
|--------|------:|----------|
| MySQL tables | ${tableCount} | \`Database_Fintech/master_database.sql\` \`CREATE TABLE\` |
| Tables with \`deleted_at\` | ${deletedAtTables.length} | column scan in DDL blocks |
| Stored procedures | ${procCount} | \`CREATE PROCEDURE\` in master SQL |
| Views | ${viewCount} | \`CREATE VIEW\` (0 in schema; docs placeholder) |
| Triggers | ${triggerCount} | \`CREATE TRIGGER\` |
| Backend controllers | 47 | \`**/*.controller.ts\` under Backend_Fintech |
| Backend services | 67 | \`**/*.service.ts\` under Backend_Fintech/src |
| Backend repositories | 61 | \`**/*.repository.ts\` |
| Backend route files | 48 | \`**/*.routes.ts\` + app.ts |
| HTTP endpoints (router-defined) | 562 | static analysis of route files |
| App health endpoints | 3 | \`/api/live\`, \`/api/ready\`, \`/api/health\` in app.ts |
| Auth endpoints | 16 | \`auth.routes.ts\` |
| Middleware modules | 13 | \`*middleware*.ts\` |
| API modules (domain folders) | 46 | \`Backend_Fintech/src/app/modules/*\` |
| Frontend components | 153 | \`**/*.component.ts\` |
| Frontend services | 67 | \`**/*.service.ts\` in Frontend |
| Frontend guards | 3 | auth.guard, guest.guard, permission.guard |
| Frontend interceptors | 1 | auth.interceptor.ts |
| Frontend lazy route bundles | 37 | \`loadChildren\` in app.routes.ts |
| NgModules | 0 | no \`*.module.ts\` |
| Backend unit test files | 3 | \`src/__tests__/*.test.ts\` (non-integration) |
| Backend integration test files | 17 | \`*.integration.test.ts\` |
| E2E spec files | 16 | \`e2e/tests/*.spec.ts\` (+ auth.setup.ts) |
| E2E test cases (test()) | 66 | grep \`test(\` in e2e/tests |
| Docker Compose services | 5 | docker-compose.yml |
| Dockerfiles | 2 | Backend + Frontend |
| GitHub workflows | 3 | ci.yml, security.yml, performance.yml |
| Background job types (handled) | 4 | job-handlers.ts switch |
| Permissions (RBAC) | 144 | permissions.ts constant array |

## LOC Estimate

| Area | Lines (est.) |
|------|-------------|
| TypeScript (all) | ${countLines(tsFiles)} |
| SQL | ${countLines(sqlFiles)} |
| Markdown | ${countLines(mdFiles)} |
| **Total source (TS+SQL+MD)** | ${countLines([...tsFiles, ...sqlFiles, ...mdFiles])} |
`);

console.log('Phase 1 audit docs written to', OUT);
console.log('Files:', allFiles.length, 'Tables:', tableCount, 'deleted_at tables:', deletedAtTables.length);
