# Dead Code Inventory

> **Phase 1 — Repository Audit** · v1.0.0-rc1 · Static analysis · 2026-07-29

---

## Methodology

Static inspection only — no runtime profiling. Confidence levels: **High**, **Medium**, **Low**.

Full unused-export analysis requires tooling (ts-prune, depcheck) — marked **NOT VERIFIED** where not run.

## High Confidence Findings

| Item | Location | Evidence | Confidence |
|------|----------|----------|------------|
| Empty feature folder | `Frontend_Fintech/src/app/features/merchants/` | Directory exists, no files | **High** |
| Empty layouts folder | `Frontend_Fintech/src/app/layouts/` | No files | **High** |
| Empty pipes folder | `Frontend_Fintech/src/app/shared/pipes/` | No *.pipe.ts | **High** |
| Empty directives folder | `Frontend_Fintech/src/app/shared/directives/` | No *.directive.ts | **High** |
| Empty core/guards (duplicate) | `Frontend_Fintech/src/app/core/guards/` | Guards live in core/auth/guards | **High** |
| Empty core/interceptors (duplicate) | `Frontend_Fintech/src/app/core/interceptors/` | Interceptor in core/auth/interceptors | **High** |
| Excluded seed SQL | `23/24/25_dummy_data_*.sql` | Not in build-master.ps1 | **High** |
| DB views placeholder | `Database_Fintech/docs/views.md` | "no views defined yet" | **High** |

## Medium Confidence Findings

| Item | Location | Evidence | Confidence |
|------|----------|----------|------------|
| permissions feature (FE) | `features/permissions/services/only` | No routes, no components | **Medium** |
| Duplicate audit repository | auth + audit modules both have audit.repository.ts | Different modules — may be intentional split | **Medium** |
| Karma/Jasmine setup | Frontend package.json | **NOT VERIFIED** if any *.spec.ts exist | **Medium** |
| exports module | Single controller | Narrow API surface — may be underused | **Medium** |

## Low Confidence Findings

| Item | Notes | Confidence |
|------|-------|------------|
| Individual API endpoints | 562 endpoints — FE may not call all | **Low** |
| Backend services | All wired via controllers — unlikely dead | **Low** |
| SQL rollback scripts | Manual use only — not dead but unused in CI | **Low** |

## Commented Code

**NOT VERIFIED** — exhaustive commented-block scan not performed.

## Unknown Job Types

Worker logs `unknown_job_type` audit event for unhandled `background_jobs.job_type` — indicates potential orphan enqueue paths.

## Cross References

- [Unused_Files.md](./Unused_Files.md)
- [Unused_Components.md](./Unused_Components.md)
- [Unused_APIs.md](./Unused_APIs.md)
