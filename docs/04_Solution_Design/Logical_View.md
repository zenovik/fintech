# Logical View

> **Merchant Pro Solution Design** · v1.0.0-rc1

## Table of Contents

1. [Purpose](#purpose)
2. [Layers](#layers)
3. [Modules](#modules)

---

## Purpose

Layered structure of Backend_Fintech.

## Layers

| Layer | Responsibility |
|-------|----------------|
| routes | HTTP mapping, Swagger tags |
| controllers | Request/response, status codes |
| services | Business logic, transactions |
| repositories | SQL, row mapping |
| shared | middleware, workers, redis, logger |

## Modules

46 domain modules registered in app.ts — each exports routes index.
