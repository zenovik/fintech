# Partitioning Strategy

> **Merchant Pro Database Architecture** · v1.0.0-rc1 · Schema: `Database_Fintech/master_database.sql` (223 tables)

## Table of Contents

1. [Purpose](#purpose)
2. [Candidates](#candidates)
3. [Approach](#approach)
4. [Current](#current)

---

## Purpose

Future horizontal partitioning plan.

## Candidates

audit_logs, payment_timeline_events, login_attempts, webhook delivery history — time-series growth.

## Approach

RANGE partitioning by YEAR-MONTH on created_at when row count exceeds operational threshold.

## Current

No partitioning in rc1; indexes sufficient for UAT volumes.
