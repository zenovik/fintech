# Unused Files

> **Phase 1 — Repository Audit** · v1.0.0-rc1 · 2026-07-29

---

| Path | Type | Evidence | Confidence |
|------|------|----------|------------|
| `Frontend_Fintech/src/app/features/merchants/` | Empty directory | Glob returns 0 files | **High** |
| `Frontend_Fintech/src/app/layouts/` | Empty directory | No contents | **High** |
| `Frontend_Fintech/src/app/shared/pipes/` | Empty directory | No pipe implementations | **High** |
| `Frontend_Fintech/src/app/shared/directives/` | Empty directory | No directive implementations | **High** |
| `Frontend_Fintech/src/app/core/guards/` | Empty directory | Superseded by core/auth/guards | **High** |
| `Frontend_Fintech/src/app/core/interceptors/` | Empty directory | Superseded by core/auth/interceptors | **High** |
| `Database_Fintech/structure_queries/23_dummy_data_merchants.sql` | SQL seed | Not referenced in build-master.ps1 | **High** |
| `Database_Fintech/structure_queries/24_dummy_data_transactions.sql` | SQL seed | Not in build script | **High** |
| `Database_Fintech/structure_queries/25_dummy_data_settlements.sql` | SQL seed | Not in build script | **High** |

## Orphan Risk (not confirmed unused)

| Path | Notes |
|------|-------|
| `validation-scripts/` | **NOT VERIFIED** — may be manual QA only |
| `Design/` | Design assets — not runtime |
| `playwright-report/`, `test-results/` | Generated artifacts (gitignored partially) |

## Cross References

- [Dead_Code_Inventory.md](./Dead_Code_Inventory.md)
