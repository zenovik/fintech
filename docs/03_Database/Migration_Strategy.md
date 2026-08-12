# Migration Strategy

> **Merchant Pro Database Architecture** · v1.0.0-rc1 · Schema: `Database_Fintech/master_database.sql` (223 tables)

## Table of Contents

1. [Purpose](#purpose)
2. [Build Process](#build-process)
3. [Versioning](#versioning)
4. [Zero-Downtime](#zero-downtime)
5. [Rollback](#rollback)

---

## Purpose

Schema evolution and deployment.

## Build Process

1. Edit/add SQL in `Database_Fintech/structure_queries/`. 2. Run `build-master.ps1`. 3. Commit `master_database.sql`. 4. Docker init or manual apply for existing envs.

## Versioning

Numbered migration files (066_, 075_, etc.) appended to build order; no flyway/liquibase in rc1.

## Zero-Downtime

Additive changes preferred; destructive changes require maintenance window and backup.

## Rollback

Restore from backup or revert git commit and rebuild master SQL.
