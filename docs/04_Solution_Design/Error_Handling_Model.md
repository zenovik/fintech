# Error Handling Model

> **Merchant Pro Solution Design** · v1.0.0-rc1

## Table of Contents

1. [Purpose](#purpose)
2. [Taxonomy](#taxonomy)
3. [Handler](#handler)

---

## Purpose

Unified error taxonomy and HTTP mapping.

## Taxonomy

| Category | Code Examples | HTTP |
|----------|---------------|------|
| Business | INSUFFICIENT_BALANCE, INVALID_STATE | 409/422 |
| Validation | VALIDATION_ERROR (Zod) | 400 |
| Auth | UNAUTHORIZED | 401 |
| Authorization | FORBIDDEN | 403 |
| Infrastructure | INTERNAL_ERROR | 500 |
| Database | DUPLICATE (ER_DUP_ENTRY) | 409 |
| Network | WEBHOOK_TIMEOUT | 502 (worker retry) |
| Timeout | GATEWAY_TIMEOUT | 504 |
| Retry | retry_queue backoff | N/A (async) |

## Handler

error-handler.middleware.ts maps AppError, ZodError, MySQL errors to JSON `{ success, message, code, requestId }`.
