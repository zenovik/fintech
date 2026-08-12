# Docker Inventory

> **Phase 1 — Repository Audit** · v1.0.0-rc1 · From Dockerfiles + compose · 2026-07-29

---

## docker-compose.yml Services (5)

| Service | Image / Build | Container | Ports | Depends on |
|---------|---------------|-----------|-------|------------|
| mysql | mysql:8.0 | fintech-mysql | 3306:3306 | — |
| redis | redis:7-alpine | fintech-redis | 6379:6379 | — |
| backend | build `./Backend_Fintech` | fintech-backend | 3000:3000 | mysql, redis healthy |
| worker | build `./Backend_Fintech` | fintech-worker | none | mysql, redis, backend |
| frontend | build `./Frontend_Fintech` | fintech-frontend | 4200:80 | backend healthy |

## Init & Health

| Service | Health check | Init |
|---------|-------------|------|
| mysql | mysqladmin ping | `master_database.sql` → `/docker-entrypoint-initdb.d/` |
| redis | redis-cli ping | — |
| backend | curl `/api/ready` | — |
| worker | `scripts/worker-healthcheck.js` | `command: node dist/worker.js` |
| frontend | **NOT VERIFIED** | nginx static |

## Backend Dockerfile

| Stage | Base | Output |
|-------|------|--------|
| builder | node:20-alpine | npm ci, tsc build |
| production | node:20-alpine | dist/, node_modules production |
| EXPOSE | 3000 | |
| CMD | node dist/server.js | |

## Frontend Dockerfile

| Stage | Base | Output |
|-------|------|--------|
| builder | node:20-alpine | ng build production |
| production | nginx:1.27-alpine | static in /usr/share/nginx/html |
| EXPOSE | 80 | |
| CMD | nginx -g daemon off | |

## Shared Backend Image

Worker reuses Backend_Fintech image with different CMD — same build context.

## Volumes

```yaml
mysql_data, backend_uploads, backend_logs  # driver: local
```

## Network

```yaml
fintech-network: bridge
```

## Cross References

- [Infrastructure_Inventory.md](./Infrastructure_Inventory.md)
- Root `DEPLOYMENT.md`, `Documentation/DEPLOYMENT_GUIDE.md`
