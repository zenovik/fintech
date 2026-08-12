# Engineering Standards

> **Enterprise Governance** · v1.0.0-rc1 · Section 2 · Generated 2026-08-03

---


| Standard | Rule | Evidence | Verification | Owner |
| --- | --- | --- | --- | --- |
| Folder structure | Feature modules under src/app/modules/{module}/ | Backend_Fintech/src/app/modules/ | VERIFIED | Backend Lead |
| Controller naming | *Controller.ts in controllers/ | 51 controllers parsed | VERIFIED | Backend Lead |
| Service naming | *Service.ts in services/ | 67 services parsed | VERIFIED | Backend Lead |
| Repository naming | *Repository.ts in repositories/ | 64 repositories parsed | VERIFIED | Backend Lead |
| Route naming | *Routes export from routes/ | 552 endpoints | VERIFIED | Backend Lead |
| TypeScript | Strict typing; FE 5.7 / BE 5.8 | Implementation_Gaps.md #58 | PARTIAL | Engineering |
| Angular | Standalone components; lazy routes | 153 components; 161 lazy routes | VERIFIED | Frontend Lead |
| Express | Router → middleware → asyncHandler → controller | backend-analysis middleware-map.json | VERIFIED | Backend Lead |
| SQL | Parameterized mysql2 template strings | 877 SQL statements AST-parsed | VERIFIED | DBA |
| Migrations | master_database.sql via build-master.ps1 | Database_Fintech/scripts/build-master.ps1 | VERIFIED | DBA |
| Redis | ioredis + in-memory fallback | Backend_Fintech/docs/REDIS.md | VERIFIED | Operations |
| Workers | DB queue + Redis locks | Backend_Fintech/docs/WORKER.md | VERIFIED | Operations |
| Logging | request-logging middleware + morgan | Backend_Fintech/src/app/app.ts | VERIFIED | Backend Lead |
| Documentation | docs/01-07 layered structure | docs/README.md | VERIFIED | Engineering |


