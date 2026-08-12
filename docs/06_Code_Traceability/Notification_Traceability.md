# Notification Traceability

> **Phase 2 — Code Traceability** · v1.0.0-rc1 · 2026-07-29

---

## Chain (FR-NOT-001 → FR-NOT-002)

| Layer | Artifact |
|-------|----------|
| FR | FR-NOT-001, FR-NOT-002 |
| FE inbox | notifications-api.service.ts, notifications-state.service.ts |
| FE realtime | notifications-realtime.service.ts | **NOT VERIFIED** transport (poll/SSE) |
| API | /api/v1/notifications/* |
| Controller | notification.controller.ts |
| Services | notification.service.ts, notification-dispatch.service.ts |
| Repository | notification.repository.ts |
| Tables | notifications, notification_deliveries, templates, broadcasts, campaigns |
| Worker | notification_email via background_jobs or direct delivery poll | job-handlers.ts |
| Email | email.service.ts + nodemailer | |
| Test | notifications.integration.test.ts | E2E **NOT VERIFIED** |
| Doc | Modules/Notifications.md, Notification_Architecture.md | |

## Cross References

- [Worker_Traceability.md](./Worker_Traceability.md)
