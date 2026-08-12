# Audit Traceability

> **Phase 2 — Code Traceability** · v1.0.0-rc1 · 2026-07-29

---

## Chain (FR-AUD-001 → FR-AUD-002)

| Layer | Artifact |
|-------|----------|
| FR | FR-AUD-001, FR-AUD-002 |
| FE | audit-api.service.ts, audit-state.service.ts, audit feature pages |
| API | /api/v1/audit/*, export |
| Controller | audit.controller.ts |
| Services | audit.service.ts, audit-recorder.service.ts (shared writer) |
| Repository | audit.repository.ts (+ auth/audit.repository for auth events) |
| Tables | audit_logs, audit_api_logs, audit_categories **NOT VERIFIED** all |
| Writers | Most domain services call auditRecorder.record() | **NOT VERIFIED** exhaustive list |
| Test | reports-audit.integration.test.ts, audit.spec.ts | |
| Doc | Modules/Audit.md, Audit_Architecture.md | |

## API Request Logging

request-logging.middleware.ts — separate from audit_logs; masks sensitive routes.

## Cross References

- [Logging_Traceability.md](./Logging_Traceability.md)
