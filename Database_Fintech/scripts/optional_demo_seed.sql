-- =============================================================================
-- Optional demo enrichment seed
-- Run AFTER master_database.sql for full demo cross-links.
-- Safe with SQL_SAFE_UPDATES (all UPDATEs filter on primary key).
--
-- Usage:
--   mysql -u root -p fintech_db < Database_Fintech/scripts/optional_demo_seed.sql
-- =============================================================================

USE fintech_db;

-- Link transactions to customers (seeded ids 1-12)
UPDATE transactions SET customer_id = 1 WHERE id = 1;
UPDATE transactions SET customer_id = 2 WHERE id = 2;
UPDATE transactions SET customer_id = 3 WHERE id = 3;
UPDATE transactions SET customer_id = 4 WHERE id = 4;
UPDATE transactions SET customer_id = 5 WHERE id = 5;
UPDATE transactions SET customer_id = 6 WHERE id = 6;
UPDATE transactions SET customer_id = 7 WHERE id = 7;
UPDATE transactions SET customer_id = 8 WHERE id = 8;
UPDATE transactions SET customer_id = 9 WHERE id = 9;
UPDATE transactions SET customer_id = 10 WHERE id = 10;
UPDATE transactions SET customer_id = 11 WHERE id = 11;
UPDATE transactions SET customer_id = 12 WHERE id = 12;

-- Link chargebacks to customers
UPDATE transaction_disputes SET customer_id = 3 WHERE id = 1;
UPDATE transaction_disputes SET customer_id = 7 WHERE id = 2;
