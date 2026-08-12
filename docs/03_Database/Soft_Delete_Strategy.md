# Soft Delete Strategy

> **Merchant Pro Database Architecture** · v1.0.0-rc1 · Schema: `Database_Fintech/master_database.sql` (223 tables)

## Table of Contents

1. [Purpose](#purpose)
2. [Coverage](#coverage)
3. [Query Pattern](#query-pattern)
4. [Unique Constraints](#unique-constraints)
5. [Cross References](#cross-references)

---

## Purpose

Logical deletion via `deleted_at` DATETIME NULL.

## Coverage

**50 tables** include `deleted_at` — primarily users, merchants, organizations, customers, and configurable entities.

## Query Pattern

Application repositories default filter `deleted_at IS NULL`; admin restore sets deleted_at to NULL.

## Unique Constraints

Soft-deleted rows may block re-create unless unique keys include deleted_at or use new uuid.

## Cross References

[01_Product/Business_Rules.md](../01_Product/Business_Rules.md) for business deletion policies.
