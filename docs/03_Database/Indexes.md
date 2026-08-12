# Indexes

> **Merchant Pro Database Architecture** · v1.0.0-rc1 · Schema: `Database_Fintech/master_database.sql` (223 tables)

## Table of Contents

1. [Purpose](#purpose)
2. [Primary Keys](#primary-keys)
3. [Unique Keys](#unique-keys)
4. [Composite Indexes](#composite-indexes)
5. [Soft Delete](#soft-delete)

---

## Purpose

Indexing strategy for query performance and uniqueness.

## Primary Keys

All tables use BIGINT UNSIGNED AUTO_INCREMENT PK except small lookup tables (TINYINT/INT).

## Unique Keys

uuid columns, business refs (merchant_code, intent_ref, checkout_ref), idempotency (merchant_id + idempotency_key).

## Composite Indexes

Status + created_at on high-volume tables (payment_intents, checkout_sessions, audit_logs).

## Soft Delete

deleted_at indexed where present (50 tables) for filtered queries `WHERE deleted_at IS NULL`.
