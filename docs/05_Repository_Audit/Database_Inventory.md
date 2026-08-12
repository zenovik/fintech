# Database Inventory

> **Phase 1 — Repository Audit** · v1.0.0-rc1 · Evidence from Database_Fintech · 2026-07-29

---

## Schema Summary

| Metric | Count | Source |
|--------|------:|--------|
| Tables | 223 | `master_database.sql` — `CREATE TABLE IF NOT EXISTS` |
| Stored procedures | 5 | `CREATE PROCEDURE` in master SQL |
| Views | 0 | No `CREATE VIEW` in master SQL; `docs/views.md` placeholder |
| Triggers | 0 | No `CREATE TRIGGER` in master SQL |
| `deleted_at` references | 76 | grep in master_database.sql |
| Database name | `fintech_db` | `00_create_database.sql`, env default |

## Build Pipeline

| Step | Script | Output |
|------|--------|--------|
| Concatenate DDL + seeds | `scripts/build-master.ps1` | `master_database.sql` |
| Validate | `scripts/validate-database-build.ps1` | checksum / structure |
| Local setup | `setup-database.ps1` / `.sh` | imports master SQL |
| npm | `npm run db:build` | invokes build-master.ps1 |

## DDL Source Files (38)

Located in `Database_Fintech/structure_queries/`:

`00_create_database.sql` through `16_operations.sql` including enterprise migrations `065`–`079`.

## Seed Files

| Category | Count | Notes |
|----------|------:|-------|
| Included in build | 31 | Concatenated by build-master.ps1 |
| Present but excluded | 3 | `23_dummy_data_merchants.sql`, `24_dummy_data_transactions.sql`, `25_dummy_data_settlements.sql` — **not referenced in build-master.ps1** |
| Generator scripts | 3 | `generate-enterprise-seed.mjs`, etc. |

## Stored Procedures (5)

| Procedure | Purpose (from naming) |
|-----------|----------------------|
| `sp_seed_enterprise_payments_demo` | Demo payment seed |
| `sp_seed_payment_gateway_demo` | Gateway demo seed |
| `sp_seed_hosted_checkout_demo` | Checkout demo seed |
| `sp_seed_payment_acceptance_demo` | Acceptance demo seed |
| `sp_seed_enterprise_platform_demo` | Platform demo seed |

## Soft Delete

| Pattern | Evidence |
|---------|----------|
| `deleted_at` column | Present in multiple tables (76 references in DDL) |
| `archived_at` on organizations | **NOT VERIFIED** table-by-table — see [03_Database/Soft_Delete_Strategy.md](../03_Database/Soft_Delete_Strategy.md) |

## Audit Tables

| Table (verified in docs/code) | Module |
|-------------------------------|--------|
| `audit_logs` | audit module |
| `audit_api_logs` | audit routes `/api-logs` |
| `payment_timeline_events` | payments |
| `refund_status_history` | refunds |
| `chargeback_status_history` | chargebacks |

**Full table-to-module mapping:** **NOT VERIFIED** for all 223 tables.

## Rollback Scripts (7)

`rollback_scripts/drop_*.sql` — partial domain drops (auth, dashboard, merchant, reports, roles, settlement, transaction).

## Foreign Keys / Indexes

| Document | Location |
|----------|----------|
| Enterprise index doc | [03_Database/Indexes.md](../03_Database/Indexes.md) |
| Constraints doc | [03_Database/Constraints.md](../03_Database/Constraints.md) |
| Raw DDL | `master_database.sql` |

## Migration History

| Approach | Evidence |
|----------|----------|
| Sequential SQL files | `structure_queries/` numbered files |
| No Flyway/Liquibase | **NOT FOUND** |
| Single master artifact | Docker init + CI import `master_database.sql` |

## Cross References

- ERD: [03_Database/ERD.md](../03_Database/ERD.md)
- Data dictionary: [03_Database/Data_Dictionary.md](../03_Database/Data_Dictionary.md)
