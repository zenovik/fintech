# Architecture Verification

> **Phase 2 — Code Traceability** · v1.0.0-rc1 · 2026-07-29

---

| Architecture doc section | Implementation | Match |
|--------------------------|----------------|-------|
| Express modular monolith | 46 modules in app.ts | **Yes** |
| Angular 19 SPA | package.json 19.2.19 | **Yes** |
| JWT HS256 + refresh rotation | token.service.ts, refresh-token.repository | **Yes** |
| CSRF double-submit | csrf.middleware.ts | **Yes** |
| Redis locks | ioredis, acquireLock in worker | **Yes** |
| Custom MySQL worker queue | background_jobs, worker-runner FOR UPDATE | **Yes** |
| Docker 5 services | docker-compose.yml | **Yes** |
| Swagger /api/docs | swagger/index.ts | **Yes** |
| Feature flags gate routes | feature-flag.middleware.ts | **Yes** |
| nginx frontend | Frontend Dockerfile | **Yes** |
| BullMQ | not in codebase | **N/A** — correctly documented as rejected |
| Read replicas | not in codebase | **Future** — arch docs say rc1 single region |
| Event outbox | **NOT FOUND** | **Future** per arch docs |
| GraphQL | **NOT FOUND** | ADR REST — **Yes** |
| Prometheus | **NOT FOUND** | **Drift** — monitoring doc mentions custom metrics only |

## C4 diagrams vs code

Component diagram lists PaymentEngineService, WebhookDeliveryEngine — **Verified** files exist.

## Cross References

- [02_Architecture/README.md](../02_Architecture/README.md)
- [Documentation_Verification.md](./Documentation_Verification.md)
