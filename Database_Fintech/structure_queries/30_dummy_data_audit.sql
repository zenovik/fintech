-- =============================================================================
-- 30_dummy_data_audit.sql
-- Audit module seed data + RBAC permissions
-- =============================================================================

USE fintech_db;

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
INSERT INTO permissions (id, uuid, code, name, module, description) VALUES
  (31, 'p1000031-0000-4000-8000-000000000031', 'audit:read',  'View Audit Logs',  'audit', 'View audit and activity logs'),
  (32, 'p1000032-0000-4000-8000-000000000032', 'audit:export','Export Audit Logs','audit', 'Export audit logs to CSV')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
  (2, 31, 1), (2, 32, 1);

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
  (4, 31, 1);

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
INSERT INTO audit_categories (id, uuid, code, name, description, icon, sort_order) VALUES
  (1, 'ac000001-0000-4000-8000-000000000001', 'authentication', 'Authentication', 'Login, logout, MFA, password events', 'login', 1),
  (2, 'ac000002-0000-4000-8000-000000000002', 'users',          'Users',          'User and role management',           'manage_accounts', 2),
  (3, 'ac000003-0000-4000-8000-000000000003', 'settings',       'Settings',       'Configuration changes',              'settings', 3),
  (4, 'ac000004-0000-4000-8000-000000000004', 'notifications',  'Notifications',  'Broadcasts and templates',           'campaign', 4),
  (5, 'ac000005-0000-4000-8000-000000000005', 'merchants',      'Merchants',      'Merchant lifecycle events',          'storefront', 5),
  (6, 'ac000006-0000-4000-8000-000000000006', 'transactions',   'Transactions',   'Payment and refund events',          'payments', 6),
  (7, 'ac000007-0000-4000-8000-000000000007', 'settlements',    'Settlements',    'Settlement processing',            'account_balance', 7),
  (8, 'ac000008-0000-4000-8000-000000000008', 'reports',        'Reports',        'Report generation and export',       'assessment', 8),
  (9, 'ac000009-0000-4000-8000-000000000009', 'security',       'Security',       'Security and access events',         'security', 9),
  (10,'ac00000a-0000-4000-8000-00000000000a', 'system',         'System',         'System-level operations',            'dns', 10)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ---------------------------------------------------------------------------
-- Actions
-- ---------------------------------------------------------------------------
INSERT INTO audit_actions (id, uuid, code, name, category_code, description, risk_level) VALUES
  (1,  'aa000001-0000-4000-8000-000000000001', 'login',           'Login',            'authentication', 'Successful login', 'low'),
  (2,  'aa000002-0000-4000-8000-000000000002', 'logout',          'Logout',           'authentication', 'User logout', 'low'),
  (3,  'aa000003-0000-4000-8000-000000000003', 'login_failed',    'Login Failure',    'authentication', 'Failed login attempt', 'high'),
  (4,  'aa000004-0000-4000-8000-000000000004', 'password_change', 'Password Changed', 'authentication', 'Password updated', 'medium'),
  (5,  'aa000005-0000-4000-8000-000000000005', 'mfa_enabled',     'MFA Enabled',      'authentication', 'MFA turned on', 'medium'),
  (6,  'aa000006-0000-4000-8000-000000000006', 'mfa_disabled',    'MFA Disabled',     'authentication', 'MFA turned off', 'high'),
  (7,  'aa000007-0000-4000-8000-000000000007', 'create',          'Create',           'users', 'Resource created', 'low'),
  (8,  'aa000008-0000-4000-8000-000000000008', 'update',          'Update',           'users', 'Resource updated', 'low'),
  (9,  'aa000009-0000-4000-8000-000000000009', 'delete',          'Delete',           'users', 'Resource deleted', 'medium'),
  (10, 'aa00000a-0000-4000-8000-00000000000a', 'role_change',     'Role Change',      'users', 'User roles modified', 'medium'),
  (11, 'aa00000b-0000-4000-8000-00000000000b', 'settings_change', 'Settings Change',  'settings', 'Configuration modified', 'medium'),
  (12, 'aa00000c-0000-4000-8000-00000000000c', 'broadcast',       'Broadcast',        'notifications', 'Broadcast sent', 'low'),
  (13, 'aa00000d-0000-4000-8000-00000000000d', 'template_change', 'Template Change',  'notifications', 'Template created/updated', 'low'),
  (14, 'aa00000e-0000-4000-8000-00000000000e', 'preference_change','Preference Change','notifications', 'Notification preferences updated', 'low'),
  (15, 'aa00000f-0000-4000-8000-00000000000f', 'approve',         'Approve',          'merchants', 'Merchant approved', 'low'),
  (16, 'aa000010-0000-4000-8000-000000000010', 'reject',          'Reject',           'merchants', 'Merchant rejected/suspended', 'medium'),
  (17, 'aa000011-0000-4000-8000-000000000011', 'refund',          'Refund',           'transactions', 'Transaction refunded', 'medium'),
  (18, 'aa000012-0000-4000-8000-000000000012', 'payment_failed',  'Payment Failed',   'transactions', 'Payment failure', 'high'),
  (19, 'aa000013-0000-4000-8000-000000000013', 'settlement',      'Settlement',       'settlements', 'Settlement processed', 'low'),
  (20, 'aa000014-0000-4000-8000-000000000014', 'export',          'Export',           'reports', 'Data exported', 'low'),
  (21, 'aa000015-0000-4000-8000-000000000015', 'status_change',   'Status Change',    'system', 'Status updated', 'low')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ---------------------------------------------------------------------------
-- Sample audit logs
-- ---------------------------------------------------------------------------
INSERT INTO audit_logs (id, uuid, correlation_id, user_id, actor_name, module, category_code, action_code, entity_type, entity_id, description, ip_address, user_agent, risk_level, before_values, after_values, created_at) VALUES
  (1, 'al000001-0000-4000-8000-000000000001', 'c1000001-0000-4000-8000-000000000001', 1, 'Alex Rivera', 'settings', 'settings', 'settings_change', 'api_settings', '1', 'Modified API webhook endpoint for Production cluster.', '192.168.1.42', 'Mozilla/5.0', 'low', '{"webhookUrl":"https://old.example.com/hook"}', '{"webhookUrl":"https://api.merchantpro.com/webhooks"}', DATE_SUB(NOW(6), INTERVAL 2 HOUR)),
  (2, 'al000002-0000-4000-8000-000000000002', 'c1000002-0000-4000-8000-000000000002', NULL, 'Auto-System-01', 'settlements', 'settlements', 'settlement', 'settlement', '1', 'Processed high-value settlement batch #44021.', '0.0.0.0', 'System/1.0', 'low', NULL, '{"settlementRef":"STL-44021","amount":"12450.00"}', DATE_SUB(NOW(6), INTERVAL 3 HOUR)),
  (3, 'al000003-0000-4000-8000-000000000003', 'c1000003-0000-4000-8000-000000000003', NULL, 'Unknown Entity', 'authentication', 'authentication', 'login_failed', 'user', NULL, 'Multiple failed login attempts from suspicious origin.', '91.240.118.2', 'curl/7.68.0', 'critical', NULL, '{"email":"admin@merchantpro.com","attempts":5}', DATE_SUB(NOW(6), INTERVAL 4 HOUR)),
  (4, 'al000004-0000-4000-8000-000000000004', 'c1000004-0000-4000-8000-000000000004', 1, 'Alex Rivera', 'authentication', 'authentication', 'login', 'user', '1', 'Successful login from trusted device.', '192.168.1.42', 'Mozilla/5.0', 'low', NULL, '{"method":"password"}', DATE_SUB(NOW(6), INTERVAL 5 HOUR)),
  (5, 'al000005-0000-4000-8000-000000000005', 'c1000005-0000-4000-8000-000000000005', 1, 'Alex Rivera', 'merchants', 'merchants', 'approve', 'merchant', '1', 'Approved merchant application for Acme Retail LLC.', '192.168.1.42', 'Mozilla/5.0', 'low', '{"status":"pending"}', '{"status":"active"}', DATE_SUB(NOW(6), INTERVAL 1 DAY)),
  (6, 'al000006-0000-4000-8000-000000000006', 'c1000006-0000-4000-8000-000000000006', 1, 'Alex Rivera', 'transactions', 'transactions', 'refund', 'transaction', '1', 'Processed refund of $250.00 for TXN-2024-00142.', '192.168.1.42', 'Mozilla/5.0', 'medium', '{"amount":"1250.00"}', '{"refundAmount":"250.00"}', DATE_SUB(NOW(6), INTERVAL 6 HOUR)),
  (7, 'al000007-0000-4000-8000-000000000007', 'c1000007-0000-4000-8000-000000000007', 1, 'Alex Rivera', 'notifications', 'notifications', 'broadcast', 'broadcast', 'bc-001', 'Sent system announcement to all users.', '192.168.1.42', 'Mozilla/5.0', 'low', NULL, '{"title":"Maintenance Notice","recipients":12}', DATE_SUB(NOW(6), INTERVAL 8 HOUR)),
  (8, 'al000008-0000-4000-8000-000000000008', 'c1000008-0000-4000-8000-000000000008', 1, 'Alex Rivera', 'users', 'users', 'role_change', 'user', '3', 'Assigned Operations Manager role to user.', '192.168.1.42', 'Mozilla/5.0', 'medium', '{"roles":["viewer"]}', '{"roles":["operations_manager"]}', DATE_SUB(NOW(6), INTERVAL 12 HOUR)),
  (9, 'al000009-0000-4000-8000-000000000009', 'c1000009-0000-4000-8000-000000000009', 1, 'Alex Rivera', 'authentication', 'authentication', 'password_change', 'user', '1', 'Password changed successfully.', '192.168.1.42', 'Mozilla/5.0', 'medium', NULL, '{"source":"change_password"}', DATE_SUB(NOW(6), INTERVAL 1 DAY)),
  (10,'al00000a-0000-4000-8000-00000000000a', 'c100000a-0000-4000-8000-00000000000a', 1, 'Alex Rivera', 'reports', 'reports', 'export', 'report', 'executive', 'Exported executive dashboard report to CSV.', '192.168.1.42', 'Mozilla/5.0', 'low', NULL, '{"format":"csv","rows":156}', DATE_SUB(NOW(6), INTERVAL 2 DAY))
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO audit_metadata (audit_log_id, meta_key, meta_value) VALUES
  (1, 'field', 'webhookUrl'),
  (1, 'environment', 'production'),
  (3, 'country', 'Latvia'),
  (3, 'attempt_count', '5'),
  (6, 'transaction_ref', 'TXN-2024-00142'),
  (7, 'group_code', 'all_users')
ON DUPLICATE KEY UPDATE meta_value = VALUES(meta_value);

-- ---------------------------------------------------------------------------
-- API logs
-- ---------------------------------------------------------------------------
INSERT INTO api_logs (id, uuid, correlation_id, user_id, method, path, status_code, ip_address, user_agent, response_time_ms, created_at) VALUES
  (1, 'ap000001-0000-4000-8000-000000000001', 'c1000001-0000-4000-8000-000000000001', 1, 'PUT', '/api/v1/settings/api', 200, '192.168.1.42', 'Mozilla/5.0', 145, DATE_SUB(NOW(6), INTERVAL 2 HOUR)),
  (2, 'ap000002-0000-4000-8000-000000000002', 'c1000004-0000-4000-8000-000000000004', 1, 'POST', '/api/auth/login', 200, '192.168.1.42', 'Mozilla/5.0', 312, DATE_SUB(NOW(6), INTERVAL 5 HOUR)),
  (3, 'ap000003-0000-4000-8000-000000000003', 'c1000003-0000-4000-8000-000000000003', NULL, 'POST', '/api/auth/login', 401, '91.240.118.2', 'curl/7.68.0', 89, DATE_SUB(NOW(6), INTERVAL 4 HOUR)),
  (4, 'ap000004-0000-4000-8000-000000000004', 'c1000006-0000-4000-8000-000000000006', 1, 'POST', '/api/v1/transactions/1/refund', 200, '192.168.1.42', 'Mozilla/5.0', 523, DATE_SUB(NOW(6), INTERVAL 6 HOUR)),
  (5, 'ap000005-0000-4000-8000-000000000005', 'c100000a-0000-4000-8000-00000000000a', 1, 'GET', '/api/v1/audit/export', 200, '192.168.1.42', 'Mozilla/5.0', 890, DATE_SUB(NOW(6), INTERVAL 2 DAY)),
  (6, 'ap000006-0000-4000-8000-000000000006', 'c1000005-0000-4000-8000-000000000005', 1, 'PATCH', '/api/v1/merchants/1/status', 200, '192.168.1.42', 'Mozilla/5.0', 201, DATE_SUB(NOW(6), INTERVAL 1 DAY))
ON DUPLICATE KEY UPDATE status_code = VALUES(status_code);

-- ---------------------------------------------------------------------------
-- Webhook logs
-- ---------------------------------------------------------------------------
INSERT INTO webhook_logs (id, uuid, correlation_id, event_type, url, status, status_code, payload, response_body, attempt_count, delivered_at, created_at) VALUES
  (1, 'wh000001-0000-4000-8000-000000000001', 'c1000002-0000-4000-8000-000000000002', 'settlement.completed', 'https://api.merchantpro.com/webhooks/settlements', 'success', 200, '{"settlementRef":"STL-44021","amount":"12450.00"}', '{"received":true}', 1, DATE_SUB(NOW(6), INTERVAL 3 HOUR), DATE_SUB(NOW(6), INTERVAL 3 HOUR)),
  (2, 'wh000002-0000-4000-8000-000000000002', 'c1000006-0000-4000-8000-000000000006', 'transaction.refunded', 'https://api.merchantpro.com/webhooks/transactions', 'success', 200, '{"transactionRef":"TXN-2024-00142","amount":"250.00"}', '{"received":true}', 1, DATE_SUB(NOW(6), INTERVAL 6 HOUR), DATE_SUB(NOW(6), INTERVAL 6 HOUR)),
  (3, 'wh000003-0000-4000-8000-000000000003', 'c1000003-0000-4000-8000-000000000003', 'auth.login_failed', 'https://api.merchantpro.com/webhooks/security', 'failed', 500, '{"email":"admin@merchantpro.com"}', NULL, 3, NULL, DATE_SUB(NOW(6), INTERVAL 4 HOUR)),
  (4, 'wh000004-0000-4000-8000-000000000004', 'c1000007-0000-4000-8000-000000000007', 'notification.broadcast', 'https://hooks.slack.com/services/T00/B00/xxx', 'success', 200, '{"title":"Maintenance Notice"}', 'ok', 1, DATE_SUB(NOW(6), INTERVAL 8 HOUR), DATE_SUB(NOW(6), INTERVAL 8 HOUR))
ON DUPLICATE KEY UPDATE status = VALUES(status);
