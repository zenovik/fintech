-- =============================================================================
-- drop_dashboard_tables.sql
-- Rollback dashboard and related business tables
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS dashboard_export_jobs;
DROP TABLE IF EXISTS user_dashboard_preferences;
DROP TABLE IF EXISTS regional_distribution;
DROP TABLE IF EXISTS payment_method_distribution;
DROP TABLE IF EXISTS revenue_time_series;
DROP TABLE IF EXISTS dashboard_kpi_snapshots;
DROP TABLE IF EXISTS activity_events;
DROP TABLE IF EXISTS fraud_alerts;
DROP TABLE IF EXISTS settlements;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS merchants;
DROP TABLE IF EXISTS dashboard_export_formats;
DROP TABLE IF EXISTS fraud_alert_severities;
DROP TABLE IF EXISTS activity_event_types;
DROP TABLE IF EXISTS transaction_statuses;
DROP TABLE IF EXISTS payment_method_types;
DROP TABLE IF EXISTS regions;

SET FOREIGN_KEY_CHECKS = 1;
