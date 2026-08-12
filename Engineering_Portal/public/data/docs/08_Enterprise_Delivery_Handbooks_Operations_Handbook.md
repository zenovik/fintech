# Operations Handbook

> **Enterprise Delivery — Phase 8** · v1.0.0-rc1 · Section 11 · 2026-08-03

> Evidence-based handover documentation. Unsupported claims marked **NOT VERIFIED**.

---


## Production Monitoring
Health endpoints + worker heartbeat + system metrics API

## Restarts
| Component | Procedure | Evidence |
|-----------|-----------|----------|
| Redis | Restart container; see Runbooks/Redis_Failure.md | REDIS.md |
| Worker | SIGTERM graceful; docker restart worker | WORKER.md |
| Database | MySQL restart — backup first **NOT VERIFIED** | Recovery_Strategy.md |
| API | Restart backend container/process | deployment/README.md |

## Webhook / Queue Monitoring
GET /api/v1/system/admin/status; WORKER.md queue tables

## Incident Flow
Runbooks/Incident_Response.md — ticketing **NOT VERIFIED**

## Maintenance
operations module maintenance API — PUT maintenance endpoint

## Recovery
docs/03_Database/Recovery_Strategy.md; docs/02_Architecture/Disaster_Recovery.md
