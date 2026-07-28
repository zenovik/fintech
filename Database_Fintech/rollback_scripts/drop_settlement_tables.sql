-- =============================================================================
-- drop_settlement_tables.sql
-- Rollback settlement management tables
-- =============================================================================

USE fintech_db;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS settlement_notes;
DROP TABLE IF EXISTS settlement_exports;
DROP TABLE IF EXISTS settlement_status_history;
DROP TABLE IF EXISTS settlement_bank_transfers;
DROP TABLE IF EXISTS settlement_fees;
DROP TABLE IF EXISTS settlement_reversals;
DROP TABLE IF EXISTS settlement_adjustments;
DROP TABLE IF EXISTS settlement_transactions;
DROP TABLE IF EXISTS settlements;
DROP TABLE IF EXISTS settlement_batches;

SET FOREIGN_KEY_CHECKS = 1;
