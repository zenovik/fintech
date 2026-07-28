-- =============================================================================
-- drop_merchant_tables.sql
-- Rollback merchant management tables (order respects FK dependencies)
-- =============================================================================

USE fintech_db;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS merchant_tag_assignments;
DROP TABLE IF EXISTS merchant_notes;
DROP TABLE IF EXISTS merchant_webhooks;
DROP TABLE IF EXISTS merchant_api_credentials;
DROP TABLE IF EXISTS merchant_payment_methods;
DROP TABLE IF EXISTS merchant_settlement_accounts;
DROP TABLE IF EXISTS merchant_bank_accounts;
DROP TABLE IF EXISTS merchant_documents;
DROP TABLE IF EXISTS merchant_contacts;
DROP TABLE IF EXISTS merchant_addresses;
DROP TABLE IF EXISTS merchant_tags;

SET FOREIGN_KEY_CHECKS = 1;
