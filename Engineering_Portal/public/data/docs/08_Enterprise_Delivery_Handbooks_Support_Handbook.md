# Support Handbook

> **Enterprise Delivery — Phase 8** · v1.0.0-rc1 · Section 10 · 2026-08-03

> Evidence-based handover documentation. Unsupported claims marked **NOT VERIFIED**.

---


## Common Issues
See [Knowledge_Base.md](../Knowledge_Base.md)

## Troubleshooting
1. Check /api/health, /api/ready
2. Review request logs (aggregation **NOT VERIFIED**)
3. Check worker status: GET /api/v1/system/admin/status

## Error Codes
AppError subclasses: UnauthorizedError, ForbiddenError, NotFoundError, ValidationError, ConflictError, TooManyRequestsError — app.exception.ts

## Escalation
Operations_Matrices.md — formal on-call **NOT VERIFIED**

## Merchant / Admin Support
support module; merchant-portal module — feature routes in app.routes.ts
