-- =============================================================================
-- 47_dummy_data_production_readiness.sql
-- Report center catalog, platform config, permissions, job schedules
-- =============================================================================

INSERT INTO permissions (id, uuid, code, name, module, description) VALUES
(114, 'p1000114-0000-4000-8000-000000000114', 'global_search:read',    'Global Search',         'search',          'Use global search across entities'),
(115, 'p1000115-0000-4000-8000-000000000115', 'activity_center:read',  'Activity Center',       'activity',        'View unified activity timeline'),
(116, 'p1000116-0000-4000-8000-000000000116', 'platform_config:read',  'View Platform Config',  'configuration',   'View platform configuration'),
(117, 'p1000117-0000-4000-8000-000000000117', 'platform_config:write', 'Manage Platform Config','configuration',   'Update platform configuration')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO role_permissions (role_id, permission_id) VALUES
(1, 114), (1, 115), (1, 116), (1, 117),
(2, 114), (2, 115), (2, 116),
(5, 114), (5, 115)
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

INSERT INTO report_center_catalog (code, name, category, description, source_module, display_order) VALUES
('merchant_summary',      'Merchant Summary',       'merchant',      'Merchant counts, status, TPV',           'merchants',       1),
('outlet_summary',        'Outlet Summary',         'outlet',        'Outlet performance by region',           'outlets',         2),
('settlement_summary',    'Settlement Summary',     'settlement',    'Settlement volumes and pending',         'settlements',     3),
('transaction_summary',   'Transaction Summary',    'transaction',   'Transaction volume and success rate',    'transactions',    4),
('refund_summary',        'Refund Summary',         'refund',        'Refund counts and amounts',              'refunds',         5),
('chargeback_summary',    'Chargeback Summary',     'chargeback',    'Chargeback cases and resolution',        'chargebacks',     6),
('fraud_summary',         'Fraud Summary',          'fraud',         'Fraud cases and scores',                 'fraud',           7),
('risk_summary',          'Risk Summary',           'risk',          'Risk rule triggers and evaluations',     'risk_rules',      8),
('device_summary',        'Device Summary',         'device',        'Device health and assignment',           'devices',         9),
('kyc_summary',           'KYC Summary',            'kyc',           'KYC document verification status',       'onboarding',      10),
('compliance_summary',    'Compliance Summary',     'compliance',    'Compliance queue metrics',               'onboarding_approval', 11),
('onboarding_summary',    'Onboarding Summary',     'onboarding',    'Application pipeline by stage',          'merchant_onboarding', 12),
('revenue_summary',       'Revenue Summary',        'revenue',       'Revenue trends and forecasts',           'analytics',       13),
('tax_summary',           'Tax Summary',            'tax',           'Tax profiles and GST/PAN coverage',      'accounting',      14),
('audit_summary',         'Audit Summary',          'audit',         'Audit log activity by category',         'audit',           15)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO platform_config (uuid, config_key, config_group, config_value, description) VALUES
('pc000001-0000-4000-8000-000000000001', 'settlement.default_cycle',     'settlement',  '{"cycle":"t1","instantEnabled":true}', 'Default settlement cycle'),
('pc000002-0000-4000-8000-000000000002', 'risk.large_amount_threshold',  'risk',        '{"amount":10000,"currency":"USD"}', 'Large transaction risk threshold'),
('pc000003-0000-4000-8000-000000000003', 'pricing.default_mdr',          'pricing',     '{"mdrPct":2.5,"minFee":0.30}', 'Default MDR pricing'),
('pc000004-0000-4000-8000-000000000004', 'merchant.code_pattern',        'merchant',    '{"prefix":"MCH","length":8,"separator":"-"}', 'Merchant code generation pattern'),
('pc000005-0000-4000-8000-000000000005', 'workflow.auto_start',          'workflow',    '{"onSubmit":true}', 'Auto-start approval workflow on submit'),
('pc000006-0000-4000-8000-000000000006', 'holiday.calendar_region',      'settlement',  '{"defaultRegion":"IN"}', 'Default holiday calendar region')
ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);

INSERT INTO background_job_schedules (uuid, job_type, cron_expression, payload, is_active) VALUES
('bjs00001-0000-4000-8000-000000000001', 'settlement_processing', '0 2 * * *', '{"batchSize":100}', 1),
('bjs00002-0000-4000-8000-000000000002', 'scheduled_report',      '0 6 * * 1', '{"reportType":"revenue_summary","format":"csv"}', 1),
('bjs00003-0000-4000-8000-000000000003', 'reminder',              '0 9 * * *', '{"type":"sla_warning"}', 1),
('bjs00004-0000-4000-8000-000000000004', 'retry',                 '*/15 * * * *', '{"maxAttempts":3}', 1)
ON DUPLICATE KEY UPDATE cron_expression = VALUES(cron_expression);

INSERT INTO notification_events (uuid, code, name, category, description, is_enabled) VALUES
('ne000060-0000-4000-8000-000000000060', 'report_scheduled',     'Scheduled Report Ready',  'system', 'Scheduled report generated', 1),
('ne000061-0000-4000-8000-000000000061', 'operations_task',      'Operations Task Pending', 'system', 'Pending operations task', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO audit_actions (uuid, code, name, category_code, description, risk_level) VALUES
('aa000060-0000-4000-8000-000000000060', 'report_exported',      'Report Exported',       'reports',      'Report exported from report center', 'low'),
('aa000061-0000-4000-8000-000000000061', 'config_changed',       'Platform Config Changed','settings',    'Platform configuration updated', 'medium'),
('aa000062-0000-4000-8000-000000000062', 'global_search',        'Global Search',         'system',       'Global search executed', 'low')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Demo saved filter
INSERT INTO report_saved_filters (uuid, user_id, organization_id, report_type, filter_name, filters, is_default) VALUES
('rsf00001-0000-4000-8000-000000000001', 1, 1, 'transaction_summary', 'Last 30 Days', '{"period":"30d","status":"success"}', 1)
ON DUPLICATE KEY UPDATE filter_name = VALUES(filter_name);

-- Demo feature flag API route blocks (disabled beta module example)
INSERT INTO feature_flag_api_routes (feature_flag_id, route_pattern, http_method)
SELECT id, CONCAT('/v1/ai/', '*'), '*' FROM feature_flags WHERE code = 'ai_assistant' LIMIT 1
ON DUPLICATE KEY UPDATE route_pattern = VALUES(route_pattern);
