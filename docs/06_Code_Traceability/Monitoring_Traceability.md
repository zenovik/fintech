# Monitoring Traceability

> **Phase 2 — Code Traceability** · v1.0.0-rc1 · 2026-07-29

---

| Signal | Endpoint / mechanism | Consumer |
|--------|---------------------|----------|
| Liveness | GET /api/live, /api/v1/system/liveness | Docker, load balancer |
| Readiness | GET /api/ready, /api/v1/system/readiness | Docker backend healthcheck |
| Health detail | GET /api/health, /api/v1/system/health | Ops |
| Metrics JSON | GET /api/v1/system/metrics | metrics.registry.ts |
| Worker heartbeat | Redis worker:heartbeat | worker-healthcheck.js |
| Operations dashboard | GET /api/v1/operations/health, alerts, incidents | FE operations-api |
| Performance | k6 reports in performance/reports/ | manual CI |

**Prometheus/Grafana:** **NOT FOUND** in repository.

## Cross References

- [02_Architecture/Monitoring_Architecture.md](../02_Architecture/Monitoring_Architecture.md)
- [04_Solution_Design/Observability_Model.md](../04_Solution_Design/Observability_Model.md)
