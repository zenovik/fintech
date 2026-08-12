# API Governance

> **Enterprise Governance** · v1.0.0-rc1 · Section 7 · Generated 2026-08-03

---


| Standard | Implementation | Evidence | Verification |
| --- | --- | --- | --- |
| Versioning | /api/v1 + /api/auth prefixes | Backend_Fintech/src/app/app.ts | VERIFIED |
| Naming | REST resource paths | 552 endpoints | VERIFIED |
| Pagination | page/pageSize query params | payment.dto.ts paymentListQuerySchema | VERIFIED |
| Errors | AppError + error-handler middleware | shared/middleware/error-handler.middleware.ts | VERIFIED |
| Validation | Zod via validateBody/Query/Params | 242 DTO schemas | VERIFIED |
| Authentication | JWT + cookie + session | auth.middleware.ts | VERIFIED |
| Authorization | authorize(PERMISSIONS.*) | authorize.middleware.ts | VERIFIED |
| Idempotency | X-Idempotency-Key on payments | payment.controller.ts | PARTIAL |
| Rate limits | Global + API rate limit middleware | global-rate-limit.middleware.ts | VERIFIED |
| Swagger | /api/docs (non-production) | Backend_Fintech/src/app/swagger/ | VERIFIED |
| DTO standards | Zod schemas in dto/*.dto.ts | backend-analysis dto-map.json | VERIFIED |


