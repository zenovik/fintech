# Scheduler Inventory

> **Phase 1 — Repository Audit** · v1.0.0-rc1 · 2026-07-29

---

## Summary

| Mechanism | Found | Evidence |
|-----------|-------|----------|
| node-cron | **NO** | Not in Backend package.json |
| OS cron | **NOT VERIFIED** | No crontab in repo |
| MySQL `background_job_schedules` | **YES** | worker-runner.ts, job-handlers.ts |
| Report scheduled jobs | **YES** | reports module — `/api/v1/reports/scheduled` |
| PM2 cron | **NOT FOUND** | ecosystem.config.cjs |

## Database Scheduler

| Component | Role |
|-----------|------|
| Table `background_job_schedules` | Stores cron-like schedule definitions |
| `processScheduledTasks()` | Called each worker tick in job-handlers.ts |
| Enqueues rows into `background_jobs` | When schedule due |

**Schedule expression format:** **NOT VERIFIED** — requires reading repository SQL + processScheduledTasks implementation.

## Report Scheduling

| API | Purpose |
|-----|---------|
| GET/POST/PUT/DELETE `/api/v1/reports/scheduled` | CRUD scheduled reports |
| reports.service.ts | References cron strings in types |

**Execution of scheduled reports:** **NOT VERIFIED** — may require worker or API trigger.

## Worker Tick Loop

Not a cron — continuous polling every `WORKER_POLL_INTERVAL_MS` processes:
1. Scheduled tasks
2. Background jobs
3. Retry queue
4. Notification emails
5. Webhook deliveries

## Cross References

- [Worker_Inventory.md](./Worker_Inventory.md)
- [03_Database/Data_Dictionary.md](../03_Database/Data_Dictionary.md) — background_jobs entry
