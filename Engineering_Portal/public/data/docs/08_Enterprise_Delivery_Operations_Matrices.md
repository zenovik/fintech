# Operations Matrices

> **Enterprise Delivery — Phase 8** · v1.0.0-rc1 · Section 20 · 2026-08-03

> Evidence-based handover documentation. Unsupported claims marked **NOT VERIFIED**.

---


## Support Matrix
| Tier | Scope | Channel | Evidence |
| --- | --- | --- | --- |
| L1 | Login, password, UI issues | NOT VERIFIED ticketing | NOT VERIFIED |
| L2 | Payment failures, webhook issues | Support module + logs | PARTIAL |
| L3 | Engineering escalation | NOT VERIFIED on-call roster | NOT VERIFIED |



## Escalation Matrix
| Severity | Response | Escalate To | Evidence |
| --- | --- | --- | --- |
| P1 — Payment outage | Immediate | Engineering + Ops | NOT VERIFIED SLA |
| P2 — Worker backlog | 1 hour | Backend team | WORKER.md monitoring |
| P3 — Single merchant issue | 4 hours | Support | support module |
| P4 — Documentation gap | Next sprint | Engineering | Implementation_Gaps.md |



## Incident Matrix
| Type | Runbook | Verification |
| --- | --- | --- |
| Database | Runbooks/Database_Failure.md | VERIFIED |
| Redis | Runbooks/Redis_Failure.md | VERIFIED |
| Worker | Runbooks/Worker_Failure.md | VERIFIED |
| Payment | Runbooks/Payment_Failure.md | VERIFIED |



## Severity Matrix
P1=Critical production down · P2=Major degradation · P3=Minor · P4=Low — **SLA definitions NOT VERIFIED**

## Ownership Matrix
| Domain | Owner | Evidence |
| --- | --- | --- |
| Backend | Backend Lead | docs/07_Governance — RACI NOT VERIFIED |
| Frontend | Frontend Lead | NOT VERIFIED assignment |
| Database | DBA | NOT VERIFIED assignment |
| DevOps | DevOps Lead | NOT VERIFIED assignment |
| Security | Security Lead | NOT VERIFIED assignment |



## Environment Matrix
| Env | Topology | Evidence |
| --- | --- | --- |
| Development | Local Node + MySQL | Executive_Summary.md |
| CI | GitHub Actions + MySQL service | ci.yml |
| Production | Docker Compose or PM2+nginx | Executive_Summary.md |
| UAT | NOT VERIFIED separate config | NOT VERIFIED |



## Monitoring Matrix
| Signal | Source | Verification |
| --- | --- | --- |
| Liveness | /api/live | VERIFIED |
| Readiness | /api/ready | VERIFIED |
| Health | /api/health | VERIFIED |
| Worker heartbeat | Redis worker:heartbeat | WORKER.md |
| Metrics | /api/v1/system/metrics | VERIFIED |
| Prometheus | NOT VERIFIED | NOT VERIFIED |
| Alerting | NOT VERIFIED | NOT VERIFIED |


