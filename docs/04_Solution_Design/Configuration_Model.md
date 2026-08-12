# Configuration Model

> **Merchant Pro Solution Design** · v1.0.0-rc1

## Table of Contents

1. [Purpose](#purpose)
2. [Env](#env)
3. [Database](#database)
4. [Validation](#validation)

---

## Purpose

Configuration sources and precedence.

## Env

.env / Docker environment — DB_*, JWT_*, REDIS_*, WORKER_* variables.

## Database

platform_settings, organization_preferences, feature_flags override runtime behavior.

## Validation

validate-env.ts fails fast on missing required secrets in production.
