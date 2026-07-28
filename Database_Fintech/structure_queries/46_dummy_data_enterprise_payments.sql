-- =============================================================================
-- 46_dummy_data_enterprise_payments.sql
-- Permissions, notifications, audit actions, seed config
-- =============================================================================

INSERT INTO permissions (id, uuid, code, name, module, description) VALUES
(97,  'p1000097-0000-4000-8000-000000000097', 'devices:read',              'View Devices',              'devices',           'View payment devices'),
(98,  'p1000098-0000-4000-8000-000000000098', 'devices:write',             'Manage Devices',            'devices',           'Provision and update devices'),
(99,  'p1000099-0000-4000-8000-000000000099', 'devices:manage',            'Administer Devices',        'devices',           'Activate, transfer, replace devices'),
(100, 'p1000100-0000-4000-8000-000000000100', 'payment_config:read',       'View Payment Config',       'payment_config',    'View merchant payment method config'),
(101, 'p1000101-0000-4000-8000-000000000101', 'payment_config:write',      'Manage Payment Config',     'payment_config',    'Update payment methods, fees, limits'),
(102, 'p1000102-0000-4000-8000-000000000102', 'pricing:read',              'View Pricing',              'pricing',           'View pricing plans and fee rules'),
(103, 'p1000103-0000-4000-8000-000000000103', 'pricing:write',             'Manage Pricing',            'pricing',           'Create and update pricing plans'),
(104, 'p1000104-0000-4000-8000-000000000104', 'risk_rules:read',           'View Risk Rules',           'risk_rules',        'View configurable risk rules'),
(105, 'p1000105-0000-4000-8000-000000000105', 'risk_rules:write',          'Manage Risk Rules',         'risk_rules',        'Create and update risk rules'),
(106, 'p1000106-0000-4000-8000-000000000106', 'risk_rules:manage',         'Administer Risk Rules',     'risk_rules',        'Enable/disable and evaluate rules'),
(107, 'p1000107-0000-4000-8000-000000000107', 'fraud:read',                'View Fraud Cases',          'fraud',             'View fraud queue and scores'),
(108, 'p1000108-0000-4000-8000-000000000108', 'fraud:write',               'Review Fraud Cases',        'fraud',             'Review and decide fraud cases'),
(109, 'p1000109-0000-4000-8000-000000000109', 'fraud:manage',              'Manage Fraud Queue',        'fraud',             'Release and bulk manage fraud'),
(110, 'p1000110-0000-4000-8000-000000000110', 'accounting:read',           'View Accounting',           'accounting',        'View ledger accounts and entries'),
(111, 'p1000111-0000-4000-8000-000000000111', 'accounting:export',         'Export Accounting',         'accounting',        'Export ledger data'),
(112, 'p1000112-0000-4000-8000-000000000112', 'terminal_inventory:read',   'View Terminal Inventory',   'terminal_inventory','View terminal stock and warehouse'),
(113, 'p1000113-0000-4000-8000-000000000113', 'terminal_inventory:write',  'Manage Terminal Inventory', 'terminal_inventory','Assign, return, damage terminals')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO role_permissions (role_id, permission_id) VALUES
(1, 97), (1, 98), (1, 99), (1, 100), (1, 101), (1, 102), (1, 103), (1, 104), (1, 105), (1, 106),
(1, 107), (1, 108), (1, 109), (1, 110), (1, 111), (1, 112), (1, 113),
(2, 97), (2, 98), (2, 99), (2, 100), (2, 101), (2, 102), (2, 103), (2, 104), (2, 105), (2, 107), (2, 108), (2, 110),
(5, 97), (5, 100), (5, 102), (5, 104), (5, 107), (5, 110)
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

INSERT INTO notification_events (uuid, code, name, category, description, is_enabled) VALUES
('ne000050-0000-4000-8000-000000000050', 'device_assigned',        'Device Assigned',         'system', 'Payment device assigned to merchant/outlet', 1),
('ne000051-0000-4000-8000-000000000051', 'qr_generated',           'QR Generated',            'transaction', 'New QR code generated', 1),
('ne000052-0000-4000-8000-000000000052', 'settlement_failed',      'Settlement Failed',       'financial', 'Settlement processing failed', 1),
('ne000053-0000-4000-8000-000000000053', 'settlement_complete',    'Settlement Complete',     'financial', 'Settlement processed successfully', 1),
('ne000054-0000-4000-8000-000000000054', 'risk_alert',             'Risk Alert',              'system', 'Risk rule triggered alert', 1),
('ne000055-0000-4000-8000-000000000055', 'fraud_alert_case',       'Fraud Case Opened',       'system', 'New fraud case for review', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO audit_actions (uuid, code, name, category_code, description, risk_level) VALUES
('aa000050-0000-4000-8000-000000000050', 'device_provisioned',   'Device Provisioned',   'operations',   'Payment device provisioned', 'medium'),
('aa000051-0000-4000-8000-000000000051', 'device_activated',     'Device Activated',     'operations',   'Payment device activated', 'medium'),
('aa000052-0000-4000-8000-000000000052', 'device_transferred',   'Device Transferred',   'operations',   'Device transferred between merchants', 'high'),
('aa000053-0000-4000-8000-000000000053', 'qr_generated',         'QR Generated',         'transactions', 'QR code generated', 'low'),
('aa000054-0000-4000-8000-000000000054', 'settlement_hold',      'Settlement Held',      'settlements',  'Settlement amount held', 'high'),
('aa000055-0000-4000-8000-000000000055', 'settlement_released',  'Settlement Released',  'settlements',  'Settlement hold released', 'medium'),
('aa000056-0000-4000-8000-000000000056', 'pricing_changed',      'Pricing Changed',      'merchants',    'Pricing plan or fee updated', 'medium'),
('aa000057-0000-4000-8000-000000000057', 'risk_rule_changed',    'Risk Rule Changed',    'operations',   'Risk rule created or updated', 'high'),
('aa000058-0000-4000-8000-000000000058', 'fraud_decision',       'Fraud Decision',       'operations',   'Fraud case reviewed', 'high')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Default pricing plan
INSERT INTO pricing_plans (id, uuid, plan_code, plan_name, scope_type, is_active) VALUES
(1, 'pp000001-0000-4000-8000-000000000001', 'DEFAULT_STD', 'Standard Default Pricing', 'default', 1)
ON DUPLICATE KEY UPDATE plan_name = VALUES(plan_name);

INSERT INTO pricing_fee_rules (pricing_plan_id, payment_method_type_id, fee_type, mdr_pct, fixed_fee, min_fee, max_fee) VALUES
(1, 1, 'mdr', 2.5000, 0.00, 0.30, 50.00),
(1, 2, 'mdr', 0.0000, 0.00, 0.00, NULL),
(1, 3, 'mdr', 1.8000, 0.00, 0.20, 25.00),
(1, 4, 'mdr', 1.5000, 0.00, 0.15, 20.00)
ON DUPLICATE KEY UPDATE mdr_pct = VALUES(mdr_pct);

-- Default risk rules
INSERT INTO risk_rules (id, uuid, rule_code, rule_name, rule_type, threshold_value, action, priority, is_active) VALUES
(1, 'rr000001-0000-4000-8000-000000000001', 'LARGE_AMOUNT',      'Large Transaction Amount',  'large_amount',     10000.0000, 'review', 10, 1),
(2, 'rr000002-0000-4000-8000-000000000002', 'VELOCITY_HOURLY',   'Hourly Velocity Limit',   'velocity',         NULL,       'hold',   20, 1),
(3, 'rr000003-0000-4000-8000-000000000003', 'BLACKLIST_COUNTRY', 'Blacklisted Country',     'blacklist',        NULL,       'block',  5,  1),
(4, 'rr000004-0000-4000-8000-000000000004', 'DEVICE_RISK',       'High Risk Device',        'device_risk',      NULL,       'review', 30, 1),
(5, 'rr000005-0000-4000-8000-000000000005', 'QR_ABUSE',          'QR Scan Abuse',           'qr_abuse',         NULL,       'alert',  40, 1),
(6, 'rr000006-0000-4000-8000-000000000006', 'FAILED_PAYMENTS',   'Multiple Failed Payments','failed_payments',  NULL,       'hold',   25, 1)
ON DUPLICATE KEY UPDATE rule_name = VALUES(rule_name);

UPDATE risk_rules SET threshold_count = 50 WHERE rule_code = 'VELOCITY_HOURLY';
UPDATE risk_rules SET country_code = 'XX' WHERE rule_code = 'BLACKLIST_COUNTRY';
UPDATE risk_rules SET threshold_count = 5 WHERE rule_code = 'FAILED_PAYMENTS';

-- Ledger accounts
INSERT INTO ledger_accounts (id, uuid, account_code, account_name, account_type, currency) VALUES
(1, 'la000001-0000-4000-8000-000000000001', 'SETTLEMENT',  'Settlement Ledger',  'settlement',  'USD'),
(2, 'la000002-0000-4000-8000-000000000002', 'FEES',        'Fees Ledger',        'fees',        'USD'),
(3, 'la000003-0000-4000-8000-000000000003', 'REFUNDS',     'Refund Ledger',      'refund',      'USD'),
(4, 'la000004-0000-4000-8000-000000000004', 'CHARGEBACKS', 'Chargeback Ledger',  'chargeback',  'USD'),
(5, 'la000005-0000-4000-8000-000000000005', 'RESERVE',     'Reserve Ledger',     'reserve',     'USD')
ON DUPLICATE KEY UPDATE account_name = VALUES(account_name);

-- Settlement calendar holidays (sample)
INSERT INTO settlement_calendar (calendar_date, is_holiday, holiday_name, region_code) VALUES
('2026-01-01', 1, 'New Year', NULL),
('2026-01-26', 1, 'Republic Day', 'IN'),
('2026-08-15', 1, 'Independence Day', 'IN'),
('2026-12-25', 1, 'Christmas', NULL)
ON DUPLICATE KEY UPDATE holiday_name = VALUES(holiday_name);
