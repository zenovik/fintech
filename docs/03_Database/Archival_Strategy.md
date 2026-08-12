# Archival Strategy

> **Merchant Pro Database Architecture** · v1.0.0-rc1 · Schema: `Database_Fintech/master_database.sql` (223 tables)

## Table of Contents

1. [Purpose](#purpose)
2. [Organization Archival](#organization-archival)
3. [Audit Retention](#audit-retention)
4. [Payment History](#payment-history)
5. [Future](#future)

---

## Purpose

Long-term retention and cold storage.

## Organization Archival

organizations.archived_at marks dormant tenants; related merchants may be suspended.

## Audit Retention

audit_logs retained per compliance config; export via audit:export permission.

## Payment History

Immutable timeline events; no hard delete of captured payments.

## Future

Partition audit_logs and payment_timeline_events by month; archive to object storage.
