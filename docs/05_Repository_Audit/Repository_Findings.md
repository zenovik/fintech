# Repository Findings

> **Phase 1 — Repository Audit** · v1.0.0-rc1 · Executive summary · 2026-07-29

---

## Overall Assessment

Merchant Pro v1.0.0-rc1 is a **feature-complete monorepo** with substantial implementation and documentation. Phase 1 reverse engineering confirms a **modular Express API (46 modules, 562 endpoints)**, **Angular 19 standalone SPA (153 components)**, and **MySQL schema (223 tables)** with a **custom MySQL-backed worker queue** (not BullMQ).

## Verified Strengths

1. **Clear layering:** routes → controllers → services → repositories across 46 backend modules.
2. **Enterprise documentation:** 107+ files in `docs/` plus 160 total markdown files.
3. **CI gate:** integration tests (101 passing per RC1), typecheck, build, E2E in ci.yml.
4. **Security controls:** JWT HS256, CSRF, helmet, rate limits, Zod validation, OWASP ZAP workflow.
5. **Containerized deployment:** 5-service Docker Compose with health checks.

## Documentation vs Implementation

| Doc claim | Verified |
|-----------|----------|
| 223 tables | Yes — master_database.sql |
| 144 permissions | Yes — permissions.ts |
| MySQL queues not BullMQ | Yes — no bullmq dependency |
| 46 API modules | Yes — module folder count |
| Redis for locks/cache | Yes — ioredis + docker redis |
| 4 worker job types | Yes — job-handlers.ts switch |

## Gaps Identified

1. **Empty frontend folders** (merchants, layouts, pipes, directives) — dead structure.
2. **permissions feature** — backend API exists; frontend has service only, no routes.
3. **accounting/pricing APIs** — no matching frontend feature folders.
4. **Integration tests** cover ~37% of modules by file count (17/46) — **NOT VERIFIED** endpoint %.
5. **Excluded seed SQL** (3 files) not in production build pipeline.
6. **No database views** despite views.md placeholder.
7. **Duplicate docs** at root, Documentation/, and docs/.

## Dead Code Summary

| Confidence | Count |
|------------|------:|
| High | 9 items (empty dirs + excluded seeds) |
| Medium | 4 items |
| Low | API/UI coverage gaps |

## Statistics Snapshot

| Metric | Value |
|--------|------:|
| TS LOC | ~56,868 |
| HTTP endpoints | 562 |
| E2E tests | 66 |
| MD docs | 160 |

## Recommendations for Phase 2

1. Automated API ↔ frontend traceability matrix.
2. ts-prune / depcheck unused code report.
3. Per-endpoint permission audit.
4. Full table-to-module usage map (223 tables).
5. Consolidate duplicate release/architecture docs with index-only root copies.

## Cross References

- [Repository_Statistics.md](./Repository_Statistics.md)
- [Repository_Risk_Register.md](./Repository_Risk_Register.md)
- [Dead_Code_Inventory.md](./Dead_Code_Inventory.md)
