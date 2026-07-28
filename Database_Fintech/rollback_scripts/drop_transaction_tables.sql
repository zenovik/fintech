-- =============================================================================
-- drop_transaction_tables.sql
-- Rollback transaction management tables
-- =============================================================================

USE fintech_db;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS transaction_attachments;
DROP TABLE IF EXISTS transaction_exports;
DROP TABLE IF EXISTS transaction_notes;
DROP TABLE IF EXISTS transaction_disputes;
DROP TABLE IF EXISTS transaction_fees;
DROP TABLE IF EXISTS transaction_refunds;
DROP TABLE IF EXISTS transaction_status_history;
DROP TABLE IF EXISTS transaction_events;

SET FOREIGN_KEY_CHECKS = 1;
