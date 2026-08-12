# Documentation Inventory

> **Phase 1 — Repository Audit** · v1.0.0-rc1 · 160 markdown files · 2026-07-29

---

## Summary

| Location | MD files | Purpose |
|----------|--------:|---------|
| `docs/` (enterprise) | 107+ | Product, architecture, database, solution design, audit |
| `Documentation/` | 9 | User/admin/API guides |
| Repo root | 8 | Release, security, architecture summaries |
| `Backend_Fintech/docs/` | 12 | Backend runbooks |
| `Database_Fintech/docs/` | 12 | Schema docs |
| `Frontend_Fintech/docs/` | 6 | Frontend guides |
| Other | 6 | Design, Postman, security reports |

**Total:** 160 markdown files (excluding node_modules)

## Enterprise docs/ Tree

| Folder | Files | Coverage |
|--------|------:|----------|
| 01_Product | 43 | Business rules, FRs, 29 module deep dives |
| 02_Architecture | 28 | C4, ADRs, domain architecture |
| 03_Database | 16 | ERD, strategies, dictionary |
| 04_Solution_Design | 20 | Runtime, error, API models |
| 05_Repository_Audit | 30 | This Phase 1 audit |

## Product Documentation Gaps (from 01_Product)

Modules **without** dedicated deep dive in `01_Product/Modules/`:

Transactions, Settlements, Payouts, Customers, Fraud, Smart Collect, Reconciliation, Support, AI, Merchant Onboarding

## Architecture Doc Alignment

| Claim (02_Architecture) | Implementation match |
|---------------------------|---------------------|
| MySQL queues not BullMQ | **VERIFIED** — no bullmq in package.json |
| 223 tables | **VERIFIED** — master_database.sql |
| 144 permissions | **VERIFIED** — permissions.ts |
| 46 API modules | **VERIFIED** — modules folder count |
| Docker 5 services | **VERIFIED** — docker-compose.yml |

## Duplicate / Overlapping Docs

| Topic | Locations |
|-------|-----------|
| Architecture | `ARCHITECTURE.md` (root), `Documentation/ARCHITECTURE.md`, `docs/02_Architecture/` |
| Deployment | `DEPLOYMENT.md`, `Documentation/DEPLOYMENT_GUIDE.md`, `docs/02_Architecture/Deployment_Architecture.md` |
| Known limitations | `KNOWN_LIMITATIONS.md`, `Documentation/KNOWN_LIMITATIONS.md` |
| Release notes | `RELEASE_NOTES.md`, `Documentation/RELEASE_NOTES_v1.0.0_RC1.md` |

**Policy:** Enterprise docs cross-reference product docs — do not duplicate business rules.

## Missing References

| Gap | Status |
|-----|--------|
| Auto-generated OpenAPI static export | **NOT FOUND** — runtime `/api/docs.json` only |
| Full 223-table data dictionary | Partial in 03_Database |
| CI/CD architecture doc | **NOT FOUND** in docs/ |
| Test architecture doc | **NOT FOUND** in docs/ |

## Cross References

- Index: [docs/README.md](../README.md)
- Backend: [Backend_Fintech/docs/README.md](../../Backend_Fintech/docs/README.md)
