# Constraints

> **Merchant Pro Database Architecture** · v1.0.0-rc1 · Schema: `Database_Fintech/master_database.sql` (223 tables)

## Table of Contents

1. [Purpose](#purpose)
2. [Foreign Keys](#foreign-keys)
3. [ENUM Columns](#enum-columns)
4. [CHECK / Defaults](#check--defaults)
5. [Uniqueness](#uniqueness)

---

## Purpose

Integrity rules beyond primary keys.

## Foreign Keys

Enforced at DB level via CONSTRAINT fk_* — prevents orphan payment intents, invalid merchant references.

## ENUM Columns

Status fields use ENUM for state machines (payment intent status, checkout status, refund status).

## CHECK / Defaults

DECIMAL(18,2) for monetary amounts; NOT NULL on created_at; DEFAULT CURRENT_TIMESTAMP.

## Uniqueness

Email on users; composite unique on role_permissions.
