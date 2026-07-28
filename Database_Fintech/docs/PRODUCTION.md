# Database Production Guide

## Schema Build

```powershell
npm run db:build
```

Produces `Database_Fintech/master_database.sql` from ordered migrations in `structure_queries/`.

## Performance Migrations

| Migration | Purpose |
|-----------|---------|
| `076_p0_remediation.sql` | FK fixes, tenant indexes |
| `077_execution_layer.sql` | Encrypted secrets, email delivery log |
| `078_production_hardening.sql` | Composite indexes, partition-ready columns, retention policies |

## Partition-Ready Design

High-volume tables include generated `partition_month` (YYYY-MM) columns:

- `transactions`
- `payment_webhook_deliveries`
- `audit_logs`
- `api_usage_logs`
- `qr_scan_history`

Future RANGE partitioning can use `partition_month` without schema redesign.

## Retention Policies

`data_retention_policies` defines archive eligibility:

| Table | Retention | Archive |
|-------|-----------|---------|
| transactions | 7 years | No |
| audit_logs | 2 years | Yes |
| webhook deliveries | 90 days | Yes |
| background_jobs | 90 days | Yes |

Archive jobs (worker-scheduled) should read from this table.

## Index Guidelines

- List queries: composite `(organization_id, created_at)` or `(status, created_at)`
- Worker polls: `(status, created_at)` or `(status, next_retry_at)`
- Avoid `DATE(column)` in WHERE — use range predicates

## Query Optimization

- Use `EXPLAIN` on dashboard and report-center aggregations
- Prefer pre-aggregated tables (`dashboard_kpi_snapshots`, `analytics_snapshots`)
- Tenant-scope all org-bound queries via `getOrganizationId()`

## Backup

- Nightly mysqldump of `fintech_db`
- Point-in-time recovery via MySQL binlog (production)
