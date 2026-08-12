# Authentication Traceability

> **Phase 2 — Code Traceability** · v1.0.0-rc1 · 2026-07-29

---

## Chain: Login (FR-AUTH-001)

| Step | Artifact | Path |
|------|----------|------|
| UI | LoginComponent | Frontend_Fintech/.../login/login.component.ts |
| Service | auth.service | core/auth/services/auth.service.ts |
| Interceptor | auth.interceptor + csrf | core/auth/interceptors/, csrf.service.ts |
| API | POST /api/auth/login | auth.routes.ts |
| Middleware | rate limit (forgot on separate route) | auth.routes.ts |
| Controller | auth.controller.ts | modules/auth/controllers/ |
| Validation | Zod login DTO | modules/auth/dto/ |
| Service | auth.service.ts | credential check, MFA branch |
| Token | token.service.ts | JWT HS256 sign |
| DB | users, login_attempts, user_sessions, refresh_tokens | auth repositories |
| Worker | password_reset_email (separate flow) | job-handlers.ts |
| Audit | auditRecorder | auth.service calls |
| Test | auth.integration.test.ts | |
| E2E | auth.spec.ts | |
| Doc | Modules/Authentication.md | |

## Chain: Refresh (FR-AUTH-004)

POST `/api/auth/refresh-token` → token.service → refresh_tokens hash lookup → rotate → new JWT.

## Chain: CSRF (FR-AUTH-010)

GET `/api/auth/csrf-token` → csrf.middleware issue → mutating requests validate header.

## Cross References

- [02_Architecture/Authentication_Architecture.md](../02_Architecture/Authentication_Architecture.md)
