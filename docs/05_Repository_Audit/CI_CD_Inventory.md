# CI/CD Inventory

> **Phase 1 — Repository Audit** · v1.0.0-rc1 · From `.github/workflows/` · 2026-07-29

---

## Workflows (3)

### ci.yml — Primary CI Gate

| Trigger | push/PR to main, master, develop |
|---------|----------------------------------|

| Job | Steps | Artifact |
|-----|-------|----------|
| backend | npm ci, typecheck, unit tests, lint, build | Backend dist |
| integration | MySQL 8 service, import master_database.sql, test:integration | — |
| frontend | npm ci, lint, build | Frontend dist |
| database | build-master.ps1, validate master SQL | master_database.sql |
| e2e | needs all above; MySQL; db:setup:unix; Playwright | — |

**Blocks merge:** Yes (default CI behavior)

### security.yml — Security Scan

| Trigger | workflow_dispatch (baseline/full/all) |
|---------|--------------------------------------|

| Step | Tool |
|------|------|
| Unit tests | Backend |
| Dependency audit | security/scripts/audit-deps.mjs |
| DAST | OWASP ZAP via run-zap.mjs |
| Summary | generate-summary.mjs |

**Blocks merge:** No (`continue-on-error: true`)

### performance.yml — k6 Performance

| Trigger | workflow_dispatch (smoke/load/stress/spike/soak) |
|---------|------------------------------------------------|

| Step | Tool |
|------|------|
| k6 install | grafana/k6-action |
| DB setup | db:setup:unix |
| Run | performance/scripts/run.mjs |

**Blocks merge:** No (`continue-on-error: true`)

## Test Commands Referenced

| Workspace | Script |
|-----------|--------|
| Backend | test:unit, test:integration, typecheck, lint |
| Frontend | build, lint |
| Root | test:e2e (Playwright) |

## Release Artifacts (repo root, not CI-generated)

CHANGELOG.md, RELEASE_NOTES.md, tag v1.0.0-rc1 documented in git history.

## Cross References

- `playwright.config.ts`
- `security/scripts/`
- `performance/scripts/run.mjs`
