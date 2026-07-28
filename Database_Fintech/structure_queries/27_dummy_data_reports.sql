-- =============================================================================
-- 27_dummy_data_reports.sql
-- Reports & Analytics seed data
-- =============================================================================

-- Report categories
INSERT INTO report_categories (id, uuid, code, name, description, display_order) VALUES
  (1, 'rc100001-0000-4000-8000-000000000001', 'financial', 'Financial Reports', 'Revenue, settlements, and financial performance', 1),
  (2, 'rc100002-0000-4000-8000-000000000002', 'transactions', 'Transaction Reports', 'Payment volume, success rates, and transaction trends', 2),
  (3, 'rc100003-0000-4000-8000-000000000003', 'merchants', 'Merchant Reports', 'Merchant growth, performance, and onboarding', 3),
  (4, 'rc100004-0000-4000-8000-000000000004', 'operations', 'Operations Reports', 'Operational KPIs and compliance summaries', 4)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Report templates
INSERT INTO report_templates (id, uuid, category_id, code, name, description, query_type, config, is_system, created_by) VALUES
  (1, 'rt100001-0000-4000-8000-000000000001', 1, 'revenue_summary', 'Revenue Summary', 'Monthly revenue breakdown with trends', 'revenue', JSON_OBJECT('groupBy', 'month', 'includeForecast', true), 1, 1),
  (2, 'rt100002-0000-4000-8000-000000000002', 1, 'settlement_summary', 'Settlement Summary', 'Settlement volumes and status breakdown', 'settlements', JSON_OBJECT('groupBy', 'status'), 1, 1),
  (3, 'rt100003-0000-4000-8000-000000000003', 2, 'transaction_volume', 'Transaction Volume', 'Transaction counts and amounts over time', 'transactions', JSON_OBJECT('groupBy', 'day'), 1, 1),
  (4, 'rt100004-0000-4000-8000-000000000004', 2, 'payment_methods', 'Payment Method Distribution', 'Breakdown by payment method type', 'transactions', JSON_OBJECT('groupBy', 'payment_method'), 1, 1),
  (5, 'rt100005-0000-4000-8000-000000000005', 3, 'merchant_growth', 'Merchant Growth', 'New merchant onboarding and active merchants', 'merchants', JSON_OBJECT('groupBy', 'month'), 1, 1),
  (6, 'rt100006-0000-4000-8000-000000000006', 3, 'top_merchants', 'Top Merchants by Volume', 'Highest volume merchants for the period', 'merchants', JSON_OBJECT('limit', 10, 'sortBy', 'volume'), 1, 1),
  (7, 'rt100007-0000-4000-8000-000000000007', 4, 'regional_analytics', 'Regional Analytics', 'Volume distribution by region', 'custom', JSON_OBJECT('groupBy', 'region'), 1, 1),
  (8, 'rt100008-0000-4000-8000-000000000008', 2, 'customer_activity', 'Customer Activity', 'Unique customers and repeat purchase rates', 'customers', JSON_OBJECT('groupBy', 'week'), 1, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Reports (saved definitions)
INSERT INTO reports (id, uuid, name, description, template_id, category_id, status, filters, created_by, updated_by) VALUES
  (1, 'rp100001-0000-4000-8000-000000000001', 'Monthly Revenue Report', 'Executive monthly revenue summary', 1, 1, 'active', JSON_OBJECT('period', 'monthly'), 1, 1),
  (2, 'rp100002-0000-4000-8000-000000000002', 'Weekly Transaction Report', 'Weekly transaction volume and trends', 3, 2, 'active', JSON_OBJECT('period', 'weekly'), 1, 1),
  (3, 'rp100003-0000-4000-8000-000000000003', 'Settlement Status Report', 'Current settlement pipeline status', 2, 1, 'active', JSON_OBJECT('period', 'monthly'), 1, 1),
  (4, 'rp100004-0000-4000-8000-000000000004', 'Top Merchants Q4', 'Top performing merchants last quarter', 6, 3, 'active', JSON_OBJECT('period', 'monthly', 'limit', 10), 1, 1),
  (5, 'rp100005-0000-4000-8000-000000000005', 'APAC Regional Report', 'APAC region performance analysis', 7, 4, 'active', JSON_OBJECT('region', 'APAC', 'period', 'monthly'), 6, 6),
  (6, 'rp100006-0000-4000-8000-000000000006', 'Payment Methods Analysis', 'Payment method mix and trends', 4, 2, 'draft', JSON_OBJECT('period', 'weekly'), 1, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Saved reports
INSERT INTO saved_reports (uuid, user_id, report_id, name, filters, is_favorite) VALUES
  ('sr100001-0000-4000-8000-000000000001', 1, 1, 'My Revenue Dashboard', JSON_OBJECT('period', 'monthly'), 1),
  ('sr100002-0000-4000-8000-000000000002', 1, 2, 'Weekly Txn Tracker', JSON_OBJECT('period', 'weekly'), 0),
  ('sr100003-0000-4000-8000-000000000003', 6, 5, 'APAC Finance View', JSON_OBJECT('region', 'APAC'), 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Scheduled reports
INSERT INTO scheduled_reports (id, uuid, report_id, user_id, name, cron_expression, format, recipients, filters, is_active, last_run_at, next_run_at, created_by) VALUES
  (1, 'sc100001-0000-4000-8000-000000000001', 1, 1, 'Monthly Revenue Email', '0 8 1 * *', 'pdf', JSON_ARRAY('admin@merchantpro.com', 'finance@merchantpro.com'), JSON_OBJECT('period', 'monthly'), 1, DATE_SUB(NOW(), INTERVAL 25 DAY), DATE_ADD(DATE_FORMAT(NOW(), '%Y-%m-01'), INTERVAL 1 MONTH) + INTERVAL 8 HOUR, 1),
  (2, 'sc100002-0000-4000-8000-000000000002', 2, 1, 'Weekly Transaction CSV', '0 7 * * 1', 'csv', JSON_ARRAY('operations@merchantpro.com'), JSON_OBJECT('period', 'weekly'), 1, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_ADD(CURDATE(), INTERVAL (8 - DAYOFWEEK(CURDATE())) DAY) + INTERVAL 7 HOUR, 1),
  (3, 'sc100003-0000-4000-8000-000000000003', 3, 6, 'Daily Settlement Status', '0 6 * * *', 'xlsx', JSON_ARRAY('finance@merchantpro.com'), JSON_OBJECT('period', 'daily'), 1, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 6 HOUR, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Report exports (history)
INSERT INTO report_exports (uuid, user_id, report_id, format, status, file_url, file_name, row_count, filter_params, completed_at) VALUES
  ('re100001-0000-4000-8000-000000000001', 1, 1, 'csv', 'completed', '/exports/reports/revenue-summary-2024-01.csv', 'revenue-summary-2024-01.csv', 12, JSON_OBJECT('period', 'monthly'), DATE_SUB(NOW(), INTERVAL 2 DAY)),
  ('re100002-0000-4000-8000-000000000002', 1, 2, 'pdf', 'completed', '/exports/reports/transaction-weekly-2024-01.pdf', 'transaction-weekly-2024-01.pdf', 52, JSON_OBJECT('period', 'weekly'), DATE_SUB(NOW(), INTERVAL 5 DAY)),
  ('re100003-0000-4000-8000-000000000003', 6, 5, 'xlsx', 'completed', '/exports/reports/apac-regional-2024-01.xlsx', 'apac-regional-2024-01.xlsx', 8, JSON_OBJECT('region', 'APAC'), DATE_SUB(NOW(), INTERVAL 1 DAY)),
  ('re100004-0000-4000-8000-000000000004', 1, 3, 'csv', 'failed', NULL, NULL, NULL, JSON_OBJECT('period', 'daily'), DATE_SUB(NOW(), INTERVAL 3 HOUR))
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- Report execution logs
INSERT INTO report_execution_logs (uuid, report_id, user_id, execution_type, status, rows_returned, duration_ms, filter_params, started_at, completed_at) VALUES
  ('el100001-0000-4000-8000-000000000001', 1, 1, 'manual', 'completed', 12, 245, JSON_OBJECT('period', 'monthly'), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 245 MICROSECOND),
  ('el100002-0000-4000-8000-000000000002', 2, 1, 'export', 'completed', 52, 512, JSON_OBJECT('period', 'weekly'), DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 512 MICROSECOND),
  ('el100003-0000-4000-8000-000000000003', 1, 1, 'scheduled', 'completed', 12, 198, JSON_OBJECT('period', 'monthly'), DATE_SUB(NOW(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 25 DAY) + INTERVAL 198 MICROSECOND),
  ('el100004-0000-4000-8000-000000000004', 3, 6, 'manual', 'failed', NULL, 89, JSON_OBJECT('period', 'daily'), DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 3 HOUR) + INTERVAL 89 MICROSECOND)
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- Analytics metrics catalog
INSERT INTO analytics_metrics (id, uuid, code, name, category, unit, description) VALUES
  (1,  'am100001-0000-4000-8000-000000000001', 'total_revenue', 'Total Revenue', 'financial', 'USD', 'Gross revenue for the period'),
  (2,  'am100002-0000-4000-8000-000000000002', 'total_transactions', 'Total Transactions', 'transactions', 'count', 'Number of processed transactions'),
  (3,  'am100003-0000-4000-8000-000000000003', 'success_rate', 'Success Rate', 'transactions', 'percent', 'Percentage of successful transactions'),
  (4,  'am100004-0000-4000-8000-000000000004', 'settlement_volume', 'Settlement Volume', 'settlements', 'USD', 'Total settlement amount'),
  (5,  'am100005-0000-4000-8000-000000000005', 'active_merchants', 'Active Merchants', 'merchants', 'count', 'Merchants with at least one transaction'),
  (6,  'am100006-0000-4000-8000-000000000006', 'new_merchants', 'New Merchants', 'merchants', 'count', 'Merchants onboarded in period'),
  (7,  'am100007-0000-4000-8000-000000000007', 'avg_transaction_value', 'Avg Transaction Value', 'transactions', 'USD', 'Average transaction amount'),
  (8,  'am100008-0000-4000-8000-000000000008', 'unique_customers', 'Unique Customers', 'customers', 'count', 'Distinct customer emails')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Analytics snapshots (12 months revenue trend sample)
INSERT INTO analytics_snapshots (uuid, snapshot_date, period_type, metric_group, data) VALUES
  ('as100001-0000-4000-8000-000000000001', DATE_SUB(CURDATE(), INTERVAL 11 MONTH), 'monthly', 'revenue_trend', JSON_OBJECT('revenue', 720000000, 'transactions', 2800000, 'forecast', 700000000)),
  ('as100002-0000-4000-8000-000000000002', DATE_SUB(CURDATE(), INTERVAL 10 MONTH), 'monthly', 'revenue_trend', JSON_OBJECT('revenue', 780000000, 'transactions', 2950000, 'forecast', 750000000)),
  ('as100003-0000-4000-8000-000000000003', DATE_SUB(CURDATE(), INTERVAL 9 MONTH), 'monthly', 'revenue_trend', JSON_OBJECT('revenue', 810000000, 'transactions', 3100000, 'forecast', 800000000)),
  ('as100004-0000-4000-8000-000000000004', DATE_SUB(CURDATE(), INTERVAL 8 MONTH), 'monthly', 'revenue_trend', JSON_OBJECT('revenue', 850000000, 'transactions', 3250000, 'forecast', 830000000)),
  ('as100005-0000-4000-8000-000000000005', DATE_SUB(CURDATE(), INTERVAL 7 MONTH), 'monthly', 'revenue_trend', JSON_OBJECT('revenue', 900000000, 'transactions', 3400000, 'forecast', 880000000)),
  ('as100006-0000-4000-8000-000000000006', DATE_SUB(CURDATE(), INTERVAL 6 MONTH), 'monthly', 'revenue_trend', JSON_OBJECT('revenue', 950000000, 'transactions', 3600000, 'forecast', 920000000)),
  ('as100007-0000-4000-8000-000000000007', DATE_SUB(CURDATE(), INTERVAL 5 MONTH), 'monthly', 'revenue_trend', JSON_OBJECT('revenue', 980000000, 'transactions', 3750000, 'forecast', 960000000)),
  ('as100008-0000-4000-8000-000000000008', DATE_SUB(CURDATE(), INTERVAL 4 MONTH), 'monthly', 'revenue_trend', JSON_OBJECT('revenue', 1020000000, 'transactions', 3900000, 'forecast', 1000000000)),
  ('as100009-0000-4000-8000-000000000009', DATE_SUB(CURDATE(), INTERVAL 3 MONTH), 'monthly', 'revenue_trend', JSON_OBJECT('revenue', 1080000000, 'transactions', 4100000, 'forecast', 1050000000)),
  ('as100010-0000-4000-8000-000000000010', DATE_SUB(CURDATE(), INTERVAL 2 MONTH), 'monthly', 'revenue_trend', JSON_OBJECT('revenue', 1120000000, 'transactions', 4250000, 'forecast', 1100000000)),
  ('as100011-0000-4000-8000-000000000011', DATE_SUB(CURDATE(), INTERVAL 1 MONTH), 'monthly', 'revenue_trend', JSON_OBJECT('revenue', 1160000000, 'transactions', 4400000, 'forecast', 1140000000)),
  ('as100012-0000-4000-8000-000000000012', CURDATE(), 'monthly', 'revenue_trend', JSON_OBJECT('revenue', 1200000000, 'transactions', 4500000, 'forecast', 1180000000)),
  ('as100013-0000-4000-8000-000000000013', CURDATE(), 'monthly', 'transaction_trend', JSON_OBJECT('count', 4500000, 'volume', 1200000000, 'successRate', 99.8)),
  ('as100014-0000-4000-8000-000000000014', CURDATE(), 'monthly', 'settlement_trend', JSON_OBJECT('processed', 8, 'pending', 2, 'volume', 4250000)),
  ('as100015-0000-4000-8000-000000000015', CURDATE(), 'monthly', 'merchant_growth', JSON_OBJECT('active', 12450, 'new', 142, 'growthPct', 4.2)),
  ('as100016-0000-4000-8000-000000000016', CURDATE(), 'monthly', 'payment_methods', JSON_OBJECT('credit_card', 65.2, 'e_wallet', 24.8, 'bank_transfer', 10.0)),
  ('as100017-0000-4000-8000-000000000017', CURDATE(), 'monthly', 'regional', JSON_OBJECT('NA', 40.21, 'EMEA', 32.93, 'APAC', 26.86))
ON DUPLICATE KEY UPDATE data = VALUES(data);

-- Analytics widgets
INSERT INTO analytics_widgets (id, uuid, code, name, widget_type, config, metric_codes, display_order, is_active) VALUES
  (1, 'aw100001-0000-4000-8000-000000000001', 'revenue_trend', 'Revenue Trend', 'chart', JSON_OBJECT('chartType', 'area'), JSON_ARRAY('total_revenue'), 1, 1),
  (2, 'aw100002-0000-4000-8000-000000000002', 'transaction_trend', 'Transaction Trend', 'chart', JSON_OBJECT('chartType', 'line'), JSON_ARRAY('total_transactions'), 2, 1),
  (3, 'aw100003-0000-4000-8000-000000000003', 'settlement_trend', 'Settlement Trend', 'chart', JSON_OBJECT('chartType', 'bar'), JSON_ARRAY('settlement_volume'), 3, 1),
  (4, 'aw100004-0000-4000-8000-000000000004', 'merchant_growth', 'Merchant Growth', 'chart', JSON_OBJECT('chartType', 'line'), JSON_ARRAY('active_merchants', 'new_merchants'), 4, 1),
  (5, 'aw100005-0000-4000-8000-000000000005', 'top_merchants', 'Top Merchants', 'table', JSON_OBJECT('limit', 10), JSON_ARRAY('total_revenue'), 5, 1),
  (6, 'aw100006-0000-4000-8000-000000000006', 'payment_methods', 'Payment Methods', 'donut', JSON_OBJECT('chartType', 'donut'), JSON_ARRAY('total_transactions'), 6, 1),
  (7, 'aw100007-0000-4000-8000-000000000007', 'regional_analytics', 'Regional Analytics', 'bar', JSON_OBJECT('chartType', 'bar'), JSON_ARRAY('total_revenue'), 7, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Dashboard preferences (reports analytics)
INSERT INTO dashboard_preferences (user_id, default_period, widget_layout, theme) VALUES
  (1, 'monthly', JSON_ARRAY('revenue_trend', 'transaction_trend', 'payment_methods', 'regional_analytics'), 'default'),
  (6, 'weekly', JSON_ARRAY('settlement_trend', 'revenue_trend', 'top_merchants'), 'default')
ON DUPLICATE KEY UPDATE default_period = VALUES(default_period);

-- Additional permissions for reports & analytics
INSERT INTO permissions (id, uuid, code, name, module, description) VALUES
(20, 'p1000020-0000-4000-8000-000000000020', 'reports:read',    'View Reports',     'reports',   'List and view reports'),
(21, 'p1000021-0000-4000-8000-000000000021', 'reports:write',   'Manage Reports',   'reports',   'Create, edit, and run reports'),
(22, 'p1000022-0000-4000-8000-000000000022', 'reports:export',  'Export Reports',   'reports',   'Export and schedule reports'),
(23, 'p1000023-0000-4000-8000-000000000023', 'analytics:read',  'View Analytics',   'analytics', 'Access analytics dashboards'),
(24, 'p1000024-0000-4000-8000-000000000024', 'analytics:export','Export Analytics', 'analytics', 'Export analytics data')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Grant reports/analytics to Admin (all new permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions WHERE code IN ('reports:read', 'reports:write', 'reports:export', 'analytics:read', 'analytics:export')
ON DUPLICATE KEY UPDATE granted_at = granted_at;

-- Grant reports/analytics to Finance Manager
INSERT INTO role_permissions (role_id, permission_id) VALUES
(3, 20), (3, 21), (3, 22), (3, 23), (3, 24)
ON DUPLICATE KEY UPDATE granted_at = granted_at;

-- Grant read/export to Operations Manager
INSERT INTO role_permissions (role_id, permission_id) VALUES
(4, 20), (4, 22), (4, 23)
ON DUPLICATE KEY UPDATE granted_at = granted_at;

-- Grant read to Support Agent
INSERT INTO role_permissions (role_id, permission_id) VALUES
(6, 20), (6, 23)
ON DUPLICATE KEY UPDATE granted_at = granted_at;

-- Grant read to Read Only
INSERT INTO role_permissions (role_id, permission_id) VALUES
(7, 20), (7, 23)
ON DUPLICATE KEY UPDATE granted_at = granted_at;
