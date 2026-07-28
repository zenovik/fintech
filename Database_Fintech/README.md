# Database — Merchant Management Portal

MySQL 8 database schema, seeds, and maintenance scripts.

## Structure

```
Database_Fintech/
├── master_database.sql      # Single executable script (schema + seed data)
├── structure_queries/       # Modular SQL source files
├── scripts/
│   ├── build-master.ps1     # Rebuild master_database.sql from source files
│   └── setup-database.ps1   # Drop + recreate database from master script
├── rollback_scripts/        # Drop utilities for individual modules
├── sample_data/             # Module-specific sample data
├── erd/                     # Entity-Relationship Diagrams
├── docs/                    # Schema documentation
└── backups/                 # Database backups (gitignored)
```

## Rules

1. `master_database.sql` must always contain **all** SQL in execution order.
2. Modular files in `structure_queries/` are the development source.
3. After editing any file in `structure_queries/`, run `npm run db:build` from the project root.
4. Rollback scripts must be kept up to date as tables are added.

## Fresh Database Setup

No manual SQL, INSERT statements, permission fixes, or role creation is required. Run **only** `master_database.sql`.

### Option A — npm script (recommended)

```bash
# Set your MySQL root password (or application user password)
$env:MYSQL_PASSWORD="your_password"   # PowerShell
# MYSQL_PASSWORD=your_password       # bash

npm run db:setup
```

Optional overrides: `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER` (default: `localhost`, `3306`, `root`).

### Option B — MySQL CLI

```bash
mysql -u root -p < Database_Fintech/master_database.sql
```

### Option C — Docker Compose

From the project root, `master_database.sql` is mounted as a MySQL init script:

```bash
cp .env.example .env
npm run docker:up
```

On first container start, MySQL runs `master_database.sql` automatically.

## Source File Order

`npm run db:build` concatenates files in this order:

**Schema (DDL):**

| File | Module |
| ---- | ------ |
| `00_create_database.sql` | Database creation |
| `03_users.sql` | Users |
| `04_auth.sql` | Authentication |
| `01_lookup_tables.sql` | Lookup tables |
| `05_merchants.sql` | Merchants |
| `06_merchant_management.sql` | Merchant management |
| `07_transactions.sql` | Transactions |
| `08_transaction_management.sql` | Transaction management |
| `09_settlement_management.sql` | Settlements |
| `09_dashboard.sql` | Dashboard |
| `10_roles_permissions.sql` | Roles & permissions |
| `11_reports_analytics.sql` | Reports & analytics |

**Seed data (DML):**

| File | Module |
| ---- | ------ |
| `21_dummy_data_auth.sql` | Auth users & sessions |
| `22_dummy_data_dashboard.sql` | Dashboard metrics |
| `23_dummy_data_merchants.sql` | Merchants |
| `24_dummy_data_transactions.sql` | Transactions |
| `25_dummy_data_settlements.sql` | Settlements |
| `26_dummy_data_roles.sql` | Roles, permissions, assignments |
| `27_dummy_data_reports.sql` | Reports & analytics |

## Demo Data

All password-based demo users use **`Password123!`**.

Primary login: `admin@merchantpro.com` / `Password123!`

See the [root README](../README.md#demo-users) for the full user list.

## Rollback Scripts

Located in `rollback_scripts/`. Use to drop module tables during development:

```bash
mysql -u root -p fintech_db < rollback_scripts/drop_reports_analytics_tables.sql
```

After structural changes, rebuild the master script:

```bash
npm run db:build
```

## Backup & Restore

### Backup

```bash
mysqldump -u root -p fintech_db > Database_Fintech/backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

On Windows PowerShell:

```powershell
mysqldump -u root -p fintech_db > "Database_Fintech/backups/backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
```

### Restore

```bash
mysql -u root -p fintech_db < Database_Fintech/backups/backup_YYYYMMDD_HHMMSS.sql
```

For a full reset (drop and recreate from master script), use `npm run db:setup` instead.

See [DEPLOYMENT.md](../DEPLOYMENT.md) for production backup guidance.
