# Database Overview

> **Merchant Pro Database Architecture** · v1.0.0-rc1 · Schema: `Database_Fintech/master_database.sql` (223 tables)

## Table of Contents

1. [Purpose](#purpose)
2. [Scope](#scope)
3. [Build Pipeline](#build-pipeline)
4. [Engine & Charset](#engine--charset)
5. [Domains](#domains)
6. [Cross References](#cross-references)

---

## Purpose

Central data architecture for Merchant Pro (`fintech_db`). Single MySQL 8 schema with **223 tables**, **50** implementing soft delete via `deleted_at`.

## Scope

Identity, merchants, payments, checkout, subscriptions, invoices, notifications, audit, configuration, reporting, and operational queue tables.

## Build Pipeline

Schema assembled by `Database_Fintech/scripts/build-master.ps1` from ordered files in `structure_queries/` → `master_database.sql`. Docker mounts this for init.

## Engine & Charset

InnoDB, utf8mb4_unicode_ci, BIGINT UNSIGNED surrogate keys, CHAR(36) UUIDs for external references.

## Domains

| Domain | Example Tables | Approx Tables |
|--------|----------------|---------------|
| Identity | users, refresh_tokens, user_sessions | 15+ |
| Organization | organizations, organization_members | 12+ |
| Merchant | merchants, outlets, merchant_users | 25+ |
| Payments | payment_intents, payment_orders | 20+ |
| Checkout | checkout_sessions, checkout_themes | 8+ |
| Platform | audit_logs, feature_flags, background_jobs | 30+ |

## Cross References

[ERD.md](./ERD.md) · [Data_Dictionary.md](./Data_Dictionary.md) · [01_Product](../01_Product/README.md)
