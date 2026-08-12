# Product Documentation — Merchant Pro

Enterprise product documentation for the Merchant Management Portal (Merchant Pro). This folder is the **master business and product reference** for all future technical documents (SRS, API specs, test plans, runbooks).

## Document Set

| Document | Purpose |
|----------|---------|
| [Product_Functional_Specification.md](./Product_Functional_Specification.md) | Master PFS — complete product definition |
| [Executive_Summary.md](./Executive_Summary.md) | Stakeholder overview |
| [Product_Vision.md](./Product_Vision.md) | Vision, market, positioning |
| [Product_Glossary.md](./Product_Glossary.md) | Terminology |
| [User_Roles.md](./User_Roles.md) | RBAC and permission matrix |
| [Business_Rules.md](./Business_Rules.md) | Domain rules and policies |
| [Functional_Requirements.md](./Functional_Requirements.md) | Numbered requirements with acceptance criteria |
| [Non_Functional_Requirements.md](./Non_Functional_Requirements.md) | Performance, security, operations |
| [User_Journeys.md](./User_Journeys.md) | End-to-end flows |
| [Feature_Matrix.md](./Feature_Matrix.md) | Module × role × status |
| [Assumptions_and_Constraints.md](./Assumptions_and_Constraints.md) | Scope boundaries |
| [Success_Metrics.md](./Success_Metrics.md) | KPIs and targets |

## Module Deep Dives (Sprint 1.1)

Implementation-level specifications — one document per functional module, each with 25 sections (workflows, validation, permissions, lifecycle, API/DB mapping, security, edge cases).

| Index | Description |
|-------|-------------|
| [Modules/README.md](./Modules/README.md) | Module catalog and API index |
| [Modules/Authentication.md](./Modules/Authentication.md) | Example entry point for module doc structure |

**29 module documents** under [Modules/](./Modules/) covering identity, merchants, payments, developer integration, platform services, and infrastructure.

## Version

| Field | Value |
|-------|-------|
| Product | Merchant Pro — Merchant Management Portal |
| Release | v1.0.0-rc1 |
| Status | Approved for UAT |
| Last updated | 29 July 2026 (Sprint 1.1 module expansion) |

## Related Technical Documentation

- [Documentation/ARCHITECTURE.md](../../Documentation/ARCHITECTURE.md) — system architecture
- [Documentation/ADMIN_GUIDE.md](../../Documentation/ADMIN_GUIDE.md) — administrator operations
- [SECURITY.md](../../SECURITY.md) — security controls
- [Backend_Fintech/docs/](../../Backend_Fintech/docs/) — backend technical guides

## Conventions

- Requirements use prefix `FR-` (functional) and `NFR-` (non-functional)
- Business rules use prefix `BR-`
- Cross-references use section numbers from the PFS
