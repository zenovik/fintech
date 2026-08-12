# CTO Handbook

> **Enterprise Delivery — Phase 8** · v1.0.0-rc1 · Section 2 · 2026-08-03

> Evidence-based handover documentation. Unsupported claims marked **NOT VERIFIED**.

---


## Architecture Overview
Express modular monolith (46 modules), Angular 19 SPA, MySQL 8, optional Redis, custom DB-queue workers. Evidence: docs/02_Architecture/Architecture_Overview.md

## Business Overview
Merchant Management Portal for payment operations — docs/01_Product/Executive_Summary.md

## Scaling Strategy
Horizontal API + worker replicas; Redis locks; MySQL bottleneck — docs/02_Architecture/Scalability_Architecture.md

## Technology Decisions
16 ADRs in docs/02_Architecture/Architecture_Decision_Records.md

## Risks
15 items — docs/07_Governance/Risk_Register.md

## Future Roadmap
docs/02_Architecture/ — Future Evolution sections; event outbox **NOT VERIFIED**

## Technical Debt
12 items — docs/07_Governance/Technical_Debt_Register.md

## Ownership
Per docs/07_Governance/Repository_Governance.md — formal RACI **NOT VERIFIED**
