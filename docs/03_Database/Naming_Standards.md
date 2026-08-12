# Naming Standards

> **Merchant Pro Database Architecture** · v1.0.0-rc1 · Schema: `Database_Fintech/master_database.sql` (223 tables)

## Table of Contents

1. [Purpose](#purpose)
2. [Tables](#tables)
3. [Columns](#columns)
4. [Keys](#keys)
5. [Reference Codes](#reference-codes)

---

## Purpose

Consistent naming across 223 tables.

## Tables

snake_case plural nouns: `payment_intents`, `checkout_session_events`.

## Columns

snake_case; `_id` suffix for FKs; `_at` for timestamps; `_hash` for stored digests.

## Keys

uk_* unique, idx_* index, fk_* foreign key constraints.

## Reference Codes

Human-readable refs: intent_ref, checkout_ref, merchant_code — separate from uuid.
