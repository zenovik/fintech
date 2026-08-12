# Transaction Model

> **Merchant Pro Solution Design** · v1.0.0-rc1

## Table of Contents

1. [Purpose](#purpose)
2. [Pattern](#pattern)
3. [Queue Claims](#queue-claims)
4. [Isolation](#isolation)

---

## Purpose

Database transaction boundaries.

## Pattern

Services begin transaction on mysql2 connection for multi-table writes (payment create + timeline + idempotency).

## Queue Claims

Short transactions: SELECT FOR UPDATE → UPDATE status → COMMIT before handler execution.

## Isolation

Default REPEATABLE READ (InnoDB); row locks on payment_intents during refund.
