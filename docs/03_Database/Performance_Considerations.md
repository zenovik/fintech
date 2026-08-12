# Performance Considerations

> **Merchant Pro Database Architecture** · v1.0.0-rc1 · Schema: `Database_Fintech/master_database.sql` (223 tables)

## Table of Contents

1. [Purpose](#purpose)
2. [Connection Pool](#connection-pool)
3. [Hot Queries](#hot-queries)
4. [N+1 Avoidance](#n1-avoidance)
5. [Caching](#caching)

---

## Purpose

Query optimization and connection management.

## Connection Pool

mysql2 pool per API/worker process; avoid long transactions blocking queue claims.

## Hot Queries

Payment list by merchant_id + status; checkout expiry sweep; worker queue claims with LIMIT + FOR UPDATE.

## N+1 Avoidance

Repository layer batch queries; JOIN for list endpoints where needed.

## Caching

Redis for permission resolution and feature flags — not primary read path for payments.
