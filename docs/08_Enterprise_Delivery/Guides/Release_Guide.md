# Release Guide

> **Enterprise Delivery — Phase 8** · v1.0.0-rc1 · Section 17 · 2026-08-03

> Evidence-based handover documentation. Unsupported claims marked **NOT VERIFIED**.

---


## Release Checklist
| Step | Command/Evidence | Verification |
| --- | --- | --- |
| Typecheck | npm run typecheck (backend) | ci.yml |
| Lint | npm run lint | ci.yml |
| Unit tests | npm run test:unit | ci.yml |
| Integration | npm run test:integration | ci.yml — 101/101 CHANGELOG |
| Frontend build | npm run build | ci.yml |
| Database validate | build-master.ps1 | ci.yml database job |
| E2E | npm run test:e2e | ci.yml e2e job — 75 tests CHANGELOG |
| Security scan | security.yml | non-blocking — NOT VERIFIED gate |
| Update CHANGELOG | CHANGELOG.md | manual |



## Rollback
NOT VERIFIED automated — manual redeploy previous artifact

## Post-Release Monitoring
/api/health, worker heartbeat, system metrics
