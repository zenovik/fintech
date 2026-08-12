# Unused Utilities

> **Phase 1 — Repository Audit** · v1.0.0-rc1 · 2026-07-29

---

## Frontend Utilities

| Path | Files | Status |
|------|-------|--------|
| `shared/utils/` | **NOT VERIFIED** file list | Requires glob |
| `core/auth/utils/` | Auth helpers | Used by auth flow |

## Backend Utilities

| Path | Purpose |
|------|---------|
| `shared/utils/` | Cross-cutting helpers |
| Module-local utils | Per-module |

## e2e Utilities

| Path | Purpose |
|------|---------|
| `e2e/helpers/` | auth, api, navigation, cleanup |
| `e2e/utils/` | wait, unique |

All referenced by e2e specs — **active**.

## performance/ Helpers

24 files under `performance/` — used by k6 scripts — **active** when perf workflow runs.

## security/ Scripts

audit-deps.mjs, run-zap.mjs, generate-summary.mjs — **active** in security workflow.

## validation-scripts/

**NOT VERIFIED** — purpose and usage not traced in CI.

## Cross References

- [Repository_Structure.md](./Repository_Structure.md)
