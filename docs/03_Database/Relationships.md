# Relationships

> **Merchant Pro Database Architecture** · v1.0.0-rc1 · Schema: `Database_Fintech/master_database.sql` (223 tables)

## Table of Contents

1. [Purpose](#purpose)
2. [Core Patterns](#core-patterns)
3. [Junction Tables](#junction-tables)
4. [Optional FKs](#optional-fks)

---

## Purpose

Foreign key patterns and cardinality rules.

## Core Patterns

| Parent | Child | Cardinality | On Delete |
|--------|-------|-------------|----------|
| organizations | merchants | 1:N | RESTRICT |
| merchants | payment_intents | 1:N | RESTRICT |
| payment_intents | refunds | 1:N | RESTRICT |
| users | audit_logs | 1:N | SET NULL |
| checkout_sessions | payment_intents | N:1 | RESTRICT |

## Junction Tables

role_permissions, merchant_role_permissions, organization_members — many-to-many with composite PKs.

## Optional FKs

customer_id, order_id often NULL until associated; SET NULL on parent removal where historical record retained.
