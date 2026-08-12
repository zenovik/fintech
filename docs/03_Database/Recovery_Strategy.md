# Recovery Strategy

> **Merchant Pro Database Architecture** · v1.0.0-rc1 · Schema: `Database_Fintech/master_database.sql` (223 tables)

## Table of Contents

1. [Purpose](#purpose)
2. [RPO](#rpo)
3. [RTO](#rto)
4. [Procedure](#procedure)

---

## Purpose

RPO/RTO targets and restore procedures.

## RPO

Target ≤ 24 hours for rc1 single-node (daily backup); ≤ 1 hour with binlog in production hardening.

## RTO

Target ≤ 4 hours: restore dump, restart compose stack, verify `/api/ready`.

## Procedure

1. Stop traffic. 2. Restore MySQL volume or import dump. 3. Start mysql → redis → backend → worker → frontend. 4. Smoke test health endpoints.
