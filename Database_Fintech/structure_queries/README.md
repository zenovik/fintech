# Structure Queries

Modular SQL source files for the Merchant Management Portal database.

Each file is a development source module. When a module is implemented, its SQL
is added here **and** synchronized into `master_database.sql`.

## Planned Files

| File | Description |
| ---- | ----------- |
| `00_create_database.sql` | Database creation |
| `01_lookup_tables.sql` | Lookup / reference tables |
| `02_organizations.sql` | Organizations |
| `03_users.sql` | Users |
| `04_roles_permissions.sql` | Roles & permissions |
| `05_merchants.sql` | Merchants |
| `06_customers.sql` | Customers |
| `07_transactions.sql` | Transactions |
| `08_refunds.sql` | Refunds |
| `09_chargebacks.sql` | Chargebacks |
| `10_settlements.sql` | Settlements |
| `11_payouts.sql` | Payouts |
| `12_payment_links.sql` | Payment links |
| `13_invoices.sql` | Invoices |
| `14_notifications.sql` | Notifications |
| `15_audit_logs.sql` | Audit logs |
| `16_views.sql` | Views |
| `17_functions.sql` | Functions |
| `18_procedures.sql` | Stored procedures |
| `19_triggers.sql` | Triggers |
| `20_seed_master_data.sql` | Master / configuration data |
| `21_dummy_data.sql` | Dummy data for UAT |
| `22_test_data.sql` | Test data |

Files will be created as each module is implemented.
