-- =============================================================================
-- drop_reports_analytics_tables.sql
-- Rollback Reports & Analytics module tables
-- =============================================================================

DROP TABLE IF EXISTS dashboard_preferences;
DROP TABLE IF EXISTS analytics_widgets;
DROP TABLE IF EXISTS analytics_snapshots;
DROP TABLE IF EXISTS analytics_metrics;
DROP TABLE IF EXISTS report_execution_logs;
DROP TABLE IF EXISTS report_exports;
DROP TABLE IF EXISTS scheduled_reports;
DROP TABLE IF EXISTS saved_reports;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS report_templates;
DROP TABLE IF EXISTS report_categories;

DELETE FROM role_permissions WHERE permission_id IN (
  SELECT id FROM permissions WHERE code IN ('reports:read', 'reports:write', 'reports:export', 'analytics:read', 'analytics:export')
);
DELETE FROM permissions WHERE code IN ('reports:read', 'reports:write', 'reports:export', 'analytics:read', 'analytics:export');
