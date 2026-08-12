# Logging Traceability

> **Phase 2 — Code Traceability** · v1.0.0-rc1 · 2026-07-29

---

| Log type | Producer | Output | Retention |
|----------|----------|--------|-----------|
| HTTP access | morgan | stdout | Docker backend_logs volume |
| Structured app | logger (shared/logger) | stdout + /app/logs | backend_logs volume |
| Request completion | request-logging.middleware.ts | logger + duration, requestId | PII mask on sensitive routes |
| Worker | logger in worker-runner, job-handlers | stdout | same volume |
| Audit (business) | auditRecorder → audit_logs | MySQL | DB retention policy **NOT VERIFIED** |
| API audit logs | audit_api_logs table | /api/v1/audit/api-logs | |
| Webhook logs | webhook delivery records | /api/v1/audit/webhook-logs | |

## Env

LOG_LEVEL in env.ts — default info (prod), debug (non-prod).

## Cross References

- [Audit_Traceability.md](./Audit_Traceability.md)
- [02_Architecture/Logging_Architecture.md](../02_Architecture/Logging_Architecture.md)
