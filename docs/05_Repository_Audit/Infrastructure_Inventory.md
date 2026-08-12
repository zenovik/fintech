# Infrastructure Inventory

> **Phase 1 — Repository Audit** · v1.0.0-rc1 · 2026-07-29

---

## Deployment Targets

| Target | Evidence |
|--------|----------|
| Docker Compose | `docker-compose.yml` — 5 services |
| PM2 | `ecosystem.config.cjs`, `npm run pm2:*` |
| Manual Node | `npm run build:prod`, `start:prod` |
| nginx (frontend container) | Frontend Dockerfile |

## Health Endpoints

| Endpoint | Process | Purpose |
|----------|---------|---------|
| `GET /api/live` | API | Liveness |
| `GET /api/ready` | API | Readiness (DB check) |
| `GET /api/health` | API | Combined health |
| `GET /api/v1/system/liveness` | API | System module liveness |
| `GET /api/v1/system/readiness` | API | System module readiness |
| `GET /api/v1/system/health` | API | System health detail |
| `GET /api/v1/operations/health` | API | Operations dashboard health |
| Worker heartbeat | Redis key `worker:heartbeat` | Docker worker healthcheck |

## Monitoring

| Mechanism | Location | Notes |
|-----------|----------|-------|
| Custom metrics registry | `shared/observability/metrics.registry.ts` | `GET /api/v1/system/metrics` |
| Request logging | request-logging.middleware | Structured logs |
| Audit logs | audit module | DB persisted |
| Operations alerts | operations module | `/api/v1/operations/alerts` |

**Prometheus/Grafana:** **NOT FOUND** in repository.

## Logging

| Component | Implementation |
|-----------|----------------|
| HTTP access | morgan |
| App logger | `shared/logger` |
| Log files volume | `backend_logs` Docker volume → `/app/logs` |

## Redis Usage

| Use case | Evidence |
|----------|----------|
| Distributed locks | worker job claiming |
| Rate limit store | **NOT VERIFIED** — may fall back to memory |
| Worker heartbeat | worker-runner.ts |
| Cache | cache.service.ts |

## MySQL Usage

| Use case | Evidence |
|----------|----------|
| System of record | All repositories |
| Job queue | background_jobs, retry_queue |
| Webhook queue | webhook_delivery_queue, payment_webhook_deliveries |

## Volumes (Docker)

| Volume | Mount |
|--------|-------|
| mysql_data | MySQL data dir |
| backend_uploads | `/app/uploads` |
| backend_logs | `/app/logs` |

## Networks

| Network | Driver |
|---------|--------|
| fintech-network | bridge |

## Cross References

- [Docker_Inventory.md](./Docker_Inventory.md)
- [CI_CD_Inventory.md](./CI_CD_Inventory.md)
- [02_Architecture/Deployment_Architecture.md](../02_Architecture/Deployment_Architecture.md)
