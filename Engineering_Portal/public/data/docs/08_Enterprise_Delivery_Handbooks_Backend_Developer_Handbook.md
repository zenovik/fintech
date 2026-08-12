# Backend Developer Handbook

> **Enterprise Delivery — Phase 8** · v1.0.0-rc1 · Section 4 · 2026-08-03

> Evidence-based handover documentation. Unsupported claims marked **NOT VERIFIED**.

---


## Folder Structure
`Backend_Fintech/src/app/modules/{module}/{controllers,services,repositories,routes,dto}/`

## Coding Standards
docs/07_Governance/Engineering_Standards.md

## Repository Pattern
mysql2 parameterized queries — 877 SQL calls AST-mapped

## Transaction Pattern
`getConnection → beginTransaction → commit/rollback → release` — payment-engine.service.ts

## Redis
shared/infrastructure/redis.client.ts — REDIS.md

## Workers
src/worker.ts, shared/workers/ — WORKER.md

## Notifications
notificationDispatch singleton — notifications module

## Audit
auditRecorder singleton — audit module (227 AST mappings)

## Validation
Zod — validateBody/Query/Params; 242 schemas

## Testing
npm run test:unit; npm run test:integration — package.json

## Common Pitfalls
- Missing org context (requireOrgId)
- Forgetting conn parameter in transactional repo calls
- Architecture violations: backend-analysis validation report (183 flags — review DI graph)
