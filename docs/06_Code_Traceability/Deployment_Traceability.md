# Deployment Traceability

> **Phase 2 — Code Traceability** · v1.0.0-rc1 · 2026-07-29

---

## Chain: Source → Production

| Step | Command / file | Output |
|------|----------------|--------|
| DB build | npm run db:build | master_database.sql |
| BE build | npm run build:backend | Backend_Fintech/dist/ |
| FE build | npm run build:frontend -- --configuration=production | dist/frontend-fintech/ |
| Docker | docker compose build | 3 images (BE, worker, FE) + mysql + redis |
| Compose up | docker compose up -d | 5 running services |
| Alt PM2 | npm run pm2:start | ecosystem.config.cjs |

## CI deploy path

ci.yml builds artifacts — **NOT VERIFIED** auto-deploy to staging/prod (build only).

## Health gate

backend depends_on mysql/redis healthy; frontend depends_on backend healthy.

## Cross References

- [02_Architecture/Deployment_Architecture.md](../02_Architecture/Deployment_Architecture.md)
- [05_Repository_Audit/Docker_Inventory.md](../05_Repository_Audit/Docker_Inventory.md)
