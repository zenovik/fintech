# Security Model

> **Merchant Pro Solution Design** · v1.0.0-rc1

## Table of Contents

1. [Purpose](#purpose)
2. [Layers](#layers)
3. [Secrets](#secrets)
4. [Cross Reference](#cross-reference)

---

## Purpose

Application security design.

## Layers

Transport TLS → Helmet → CORS → Rate limit → CSRF → JWT auth → RBAC → audit.

## Secrets

Env-validated at startup (validate-env.ts); CONFIG_ENCRYPTION_KEY for sensitive settings.

## Cross Reference

[02_Architecture/Security_Architecture.md](../02_Architecture/Security_Architecture.md)
