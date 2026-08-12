# Backup Strategy

> **Merchant Pro Database Architecture** · v1.0.0-rc1 · Schema: `Database_Fintech/master_database.sql` (223 tables)

## Table of Contents

1. [Purpose](#purpose)
2. [Docker Volume](#docker-volume)
3. [Frequency](#frequency)
4. [Scope](#scope)
5. [Verification](#verification)

---

## Purpose

Data protection for fintech_db.

## Docker Volume

mysql_data volume — snapshot at hypervisor or `mysqldump` scheduled job.

## Frequency

Daily full backup minimum for production; binlog for point-in-time where enabled.

## Scope

Full schema + data; separate backup of backend_uploads volume.

## Verification

Periodic restore to staging and run integration test suite.
