# API Consumer Guide

> **Enterprise Delivery — Phase 8** · v1.0.0-rc1 · Section 14 · 2026-08-03

> Evidence-based handover documentation. Unsupported claims marked **NOT VERIFIED**.

---


## Authentication
Bearer token or cookie session — POST /api/auth/login

## Headers
| Header | Purpose | Evidence |
|--------|---------|----------|
| Authorization | Bearer JWT | auth.middleware.ts |
| X-Organization-Id | Tenant scope | auth.interceptor.ts |
| X-Merchant-Id | Merchant context | auth.interceptor.ts |
| X-CSRF-Token | CSRF (cookie auth) | csrf.middleware.ts |
| X-Idempotency-Key | Payment idempotency | payment.controller.ts |

## Pagination
?page=1&pageSize=25 — Zod-validated per endpoint

## Errors
{ success, message, code } shape — error-handler.middleware.ts (**exact shape NOT VERIFIED** without reading response helper)

## Versioning
/api/v1/* stable prefix

## Rate Limits
Global + API rate limit on /api/v1 — global-rate-limit.middleware.ts

## Webhooks
Backend_Fintech/docs/WEBHOOKS.md — HMAC signature

## Examples
Swagger UI at /api/docs (non-production) — Backend_Fintech/docs/api/README.md
