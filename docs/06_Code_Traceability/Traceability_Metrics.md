# Traceability Metrics

> **Phase 2 — Code Traceability** · v1.0.0-rc1 · Generated 2026-07-29 · Evidence from repository scan

## Cross References

| Layer | Path |
|-------|------|
| Product | [01_Product](../01_Product/README.md) |
| Architecture | [02_Architecture](../02_Architecture/README.md) |
| Database | [03_Database](../03_Database/README.md) |
| Repository Audit | [05_Repository_Audit](../05_Repository_Audit/README.md) |

---



## Coverage Summary

| Dimension | Total | Traced | Verified % | NOT VERIFIED % |
|-----------|------:|-------:|-----------:|---------------:|
| Functional requirements | 78 | 79 (module-level) | 72 | 28 (line-level) |
| Business rules | 52 | 52 (domain-level) | 65 | 35 |
| API route fragments | 559 | 559 | 100 (existence) | 0 |
| API full chain (FE→DB) | 562 (Phase 1) | ~120 (est.) | 21 | 79 |
| Backend modules | 46 | 46 | 100 | 0 |
| Frontend components | 153 | 153 (routed) | 95 | 5 |
| DB tables | 223 | ~25 major | 11 | 89 |
| Integration test files | 17 | 17 | — | — |
| E2E spec files | 16 | 16 | — | — |
| Product module docs | 29 | 29 | — | 10 modules without deep dive |

## Verification Levels

| Level | Description | Count |
|-------|-------------|------:|
| L1 — Exists | File/endpoint found in repo | High |
| L2 — Module mapped | Module → controller/service/repo | 46 modules |
| L3 — FR mapped | FR linked to module path | 78 FRs |
| L4 — Test mapped | Integration/E2E file linked | Partial |
| L5 — Full chain | FR→FE→API→DB→worker→test | **NOT VERIFIED** majority |

## Generator Stats

- Endpoints parsed from route files: 559
- FE API services found: 42
- Integration test files: 17
