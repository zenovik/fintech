# Duplicate Code Findings

> **Phase 1 — Repository Audit** · v1.0.0-rc1 · 2026-07-29

---

## Documentation Duplication

| Topic | Copies | Recommendation |
|-------|--------|----------------|
| Architecture overview | root ARCHITECTURE.md, Documentation/, docs/02 | Cross-reference only (existing policy) |
| Deployment | DEPLOYMENT.md, Documentation/DEPLOYMENT_GUIDE.md, docs/02 | Same |
| Known limitations | root + Documentation/ | Same |
| Release notes | root + Documentation/ | Same |

## Code Structure Duplication

| Pattern | Locations | Assessment |
|---------|-----------|------------|
| audit.repository.ts | auth module + audit module | **Medium** — may serve different schemas |
| Health endpoints | app.ts `/api/health` + system module `/api/v1/system/*` | Intentional layered health |
| Public + private checkout routes | checkout.routes.ts mounted twice | Intentional — different auth |
| user.repository.ts | auth + users modules | **NOT VERIFIED** if same table |

## Parallel Feature Folders

| Pair | Notes |
|------|-------|
| checkout vs checkout-admin | Public vs admin — intentional |
| merchant vs merchant-onboarding | Different lifecycles |

## SQL Seed Overlap

Multiple `*_dummy_data_*.sql` and `*_demo_*.sql` files — overlapping demo merchants/transactions possible — **NOT VERIFIED** conflict analysis.

## Test Data Duplication

e2e/data/, performance/data/, Database seed SQL — separate datasets — intentional.

## Cross References

- [Documentation_Inventory.md](./Documentation_Inventory.md)
