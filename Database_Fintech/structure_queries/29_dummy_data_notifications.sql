-- =============================================================================
-- 29_dummy_data_notifications.sql
-- Notification Center seed data + RBAC permissions
-- =============================================================================

USE fintech_db;

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
INSERT INTO permissions (id, uuid, code, name, module, description) VALUES
  (27, 'p1000027-0000-4000-8000-000000000027', 'notifications:read',     'View Notifications',     'notifications', 'View notification center and personal notifications'),
  (28, 'p1000028-0000-4000-8000-000000000028', 'notifications:write',    'Manage Notifications',   'notifications', 'Mark read, archive, delete personal notifications'),
  (29, 'p1000029-0000-4000-8000-000000000029', 'notifications:broadcast','Broadcast Notifications','notifications', 'Send broadcast announcements to user groups'),
  (30, 'p1000030-0000-4000-8000-000000000030', 'notifications:manage', 'Manage Templates',       'notifications', 'Create and manage notification templates')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

-- Super Admin (role 1) gets all via existing seed; Admin (role 2)
INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
  (2, 27, 1), (2, 28, 1), (2, 29, 1), (2, 30, 1);

-- Operations Manager (role 4) — read + write only
INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
  (4, 27, 1), (4, 28, 1);

-- ---------------------------------------------------------------------------
-- Channels
-- ---------------------------------------------------------------------------
INSERT INTO notification_channels (id, uuid, code, name, description, is_enabled) VALUES
  (1, 'nc000001-0000-4000-8000-000000000001', 'in_app', 'In-App',   'In-app notification center', 1),
  (2, 'nc000002-0000-4000-8000-000000000002', 'email',  'Email',    'Email delivery',             1),
  (3, 'nc000003-0000-4000-8000-000000000003', 'push',   'Push',     'Push notifications',         1),
  (4, 'nc000004-0000-4000-8000-000000000004', 'sms',    'SMS',      'SMS text messages',          0)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------
INSERT INTO notification_events (id, uuid, code, name, category, description, is_enabled) VALUES
  (1,  'ne000001-0000-4000-8000-000000000001', 'welcome',           'Welcome',              'system',      'New user welcome message', 1),
  (2,  'ne000002-0000-4000-8000-000000000002', 'password_changed',  'Password Changed',     'security',    'Password was changed', 1),
  (3,  'ne000003-0000-4000-8000-000000000003', 'mfa_enabled',       'MFA Enabled',          'security',    'Multi-factor auth enabled', 1),
  (4,  'ne000004-0000-4000-8000-000000000004', 'merchant_approved', 'Merchant Approved',    'merchant',    'Merchant application approved', 1),
  (5,  'ne000005-0000-4000-8000-000000000005', 'merchant_rejected', 'Merchant Rejected',    'merchant',    'Merchant application rejected', 1),
  (6,  'ne000006-0000-4000-8000-000000000006', 'refund_processed',  'Refund Processed',     'financial',   'Transaction refund completed', 1),
  (7,  'ne000007-0000-4000-8000-000000000007', 'settlement_completed','Settlement Completed','financial',   'Settlement payout processed', 1),
  (8,  'ne000008-0000-4000-8000-000000000008', 'payment_failed',    'Payment Failed',       'transaction', 'Transaction payment failed', 1),
  (9,  'ne000009-0000-4000-8000-000000000009', 'broadcast',         'Broadcast',            'system',      'Admin broadcast announcement', 1),
  (10, 'ne00000a-0000-4000-8000-00000000000a', 'system_announcement','System Announcement',  'system',      'System maintenance or update', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ---------------------------------------------------------------------------
-- Templates
-- ---------------------------------------------------------------------------
INSERT INTO notification_templates (id, uuid, code, name, event_code, channel, subject, body_template, category, is_active, created_by) VALUES
  (1, 'nt000001-0000-4000-8000-000000000001', 'welcome_in_app',           'Welcome (In-App)',           'welcome',           'in_app', NULL, 'Welcome to {{companyName}}! Your account is ready.', 'system', 1, 1),
  (2, 'nt000002-0000-4000-8000-000000000002', 'password_changed_in_app',  'Password Changed (In-App)',  'password_changed',  'in_app', NULL, 'Your password was successfully changed. If you did not make this change, contact support immediately.', 'security', 1, 1),
  (3, 'nt000003-0000-4000-8000-000000000003', 'mfa_enabled_in_app',       'MFA Enabled (In-App)',       'mfa_enabled',       'in_app', NULL, 'Multi-factor authentication has been enabled on your account.', 'security', 1, 1),
  (4, 'nt000004-0000-4000-8000-000000000004', 'merchant_approved_in_app', 'Merchant Approved (In-App)', 'merchant_approved', 'in_app', NULL, 'Merchant {{merchantName}} has been approved and is now active.', 'merchant', 1, 1),
  (5, 'nt000005-0000-4000-8000-000000000005', 'merchant_rejected_in_app', 'Merchant Rejected (In-App)', 'merchant_rejected', 'in_app', NULL, 'Merchant {{merchantName}} application was rejected. Reason: {{reason}}', 'merchant', 1, 1),
  (6, 'nt000006-0000-4000-8000-000000000006', 'refund_in_app',            'Refund (In-App)',            'refund_processed',  'in_app', NULL, 'Refund of {{amount}} for transaction {{transactionRef}} has been processed.', 'financial', 1, 1),
  (7, 'nt000007-0000-4000-8000-000000000007', 'settlement_in_app',        'Settlement (In-App)',        'settlement_completed','in_app', NULL, 'Settlement {{settlementRef}} for {{amount}} has been completed.', 'financial', 1, 1),
  (8, 'nt000008-0000-4000-8000-000000000008', 'payment_failed_in_app',    'Payment Failed (In-App)',    'payment_failed',    'in_app', NULL, 'Payment for transaction {{transactionRef}} failed. Reason: {{reason}}', 'transaction', 1, 1),
  (9, 'nt000009-0000-4000-8000-000000000009', 'broadcast_in_app',         'Broadcast (In-App)',         'broadcast',         'in_app', NULL, '{{message}}', 'system', 1, 1),
  (10,'nt00000a-0000-4000-8000-00000000000a', 'system_announcement_in_app','System Announcement',       'system_announcement','in_app', NULL, '{{message}}', 'system', 1, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

UPDATE notification_events SET default_template_id = 1 WHERE id = 1;
UPDATE notification_events SET default_template_id = 2 WHERE id = 2;
UPDATE notification_events SET default_template_id = 3 WHERE id = 3;
UPDATE notification_events SET default_template_id = 4 WHERE id = 4;
UPDATE notification_events SET default_template_id = 5 WHERE id = 5;
UPDATE notification_events SET default_template_id = 6 WHERE id = 6;
UPDATE notification_events SET default_template_id = 7 WHERE id = 7;
UPDATE notification_events SET default_template_id = 8 WHERE id = 8;
UPDATE notification_events SET default_template_id = 9 WHERE id = 9;
UPDATE notification_events SET default_template_id = 10 WHERE id = 10;

-- ---------------------------------------------------------------------------
-- Groups
-- ---------------------------------------------------------------------------
INSERT INTO notification_groups (id, uuid, code, name, description, is_system, created_by) VALUES
  (1, 'ng000001-0000-4000-8000-000000000001', 'all_users',  'All Users',  'All active platform users', 1, 1),
  (2, 'ng000002-0000-4000-8000-000000000002', 'admins',     'Admins',     'Users with admin roles',    1, 1),
  (3, 'ng000003-0000-4000-8000-000000000003', 'operations', 'Operations', 'Operations team members',   1, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ---------------------------------------------------------------------------
-- Sample notifications for admin user (id=1)
-- ---------------------------------------------------------------------------
INSERT INTO notifications (id, uuid, user_id, event_code, category, title, body, priority, status, icon, action_url, action_label, metadata_json, read_at, created_at) VALUES
  (1, 'n0000001-0000-4000-8000-000000000001', 1, 'password_changed', 'security', 'Password Changed Successfully',
   'Your account password was updated. If you did not make this change, please contact support immediately.',
   'high', 'unread', 'security', '/settings/account', 'Review Account', NULL, NULL, DATE_SUB(NOW(6), INTERVAL 2 MINUTE)),
  (2, 'n0000002-0000-4000-8000-000000000002', 1, 'settlement_completed', 'financial', 'Monthly Payout Successfully Processed',
   'Your settlement for the period has been initiated. $12,450.00 will be credited to your linked account ending in *8842.',
   'normal', 'unread', 'payments', '/settlements', 'View Settlement', '{"amount":"12450.00","currency":"USD"}', NULL, DATE_SUB(NOW(6), INTERVAL 4 HOUR)),
  (3, 'n0000003-0000-4000-8000-000000000003', 1, 'system_announcement', 'system', 'System Maintenance Scheduled',
   'Merchant Core will undergo scheduled maintenance on Saturday from 02:00 AM to 04:00 AM UTC. Transaction processing will remain active.',
   'normal', 'read', 'settings_suggest', NULL, NULL, NULL, DATE_SUB(NOW(6), INTERVAL 1 DAY), DATE_SUB(NOW(6), INTERVAL 1 DAY)),
  (4, 'n0000004-0000-4000-8000-000000000004', 1, 'merchant_approved', 'merchant', 'Merchant Application Approved',
   'Acme Retail LLC has been approved and is now active on the platform.',
   'normal', 'read', 'storefront', '/merchants/1', 'View Merchant', '{"merchantId":1}', DATE_SUB(NOW(6), INTERVAL 1 DAY), DATE_SUB(NOW(6), INTERVAL 2 DAY)),
  (5, 'n0000005-0000-4000-8000-000000000005', 1, 'refund_processed', 'financial', 'Refund Processed',
   'A refund of $250.00 for transaction TXN-2024-00142 has been successfully processed.',
   'normal', 'unread', 'currency_exchange', '/transactions/1', 'View Transaction', '{"transactionRef":"TXN-2024-00142","amount":"250.00"}', NULL, DATE_SUB(NOW(6), INTERVAL 3 HOUR)),
  (6, 'n0000006-0000-4000-8000-000000000006', 1, 'payment_failed', 'transaction', 'Payment Failed',
   'Payment for transaction TXN-2024-00189 failed due to insufficient funds.',
   'urgent', 'unread', 'error', '/transactions/2', 'Review Transaction', '{"transactionRef":"TXN-2024-00189"}', NULL, DATE_SUB(NOW(6), INTERVAL 30 MINUTE))
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- Delivery records for in-app
INSERT INTO notification_deliveries (id, uuid, notification_id, user_id, channel, template_id, status, delivered_at) VALUES
  (1, 'nd000001-0000-4000-8000-000000000001', 1, 1, 'in_app', 2, 'delivered', DATE_SUB(NOW(6), INTERVAL 2 MINUTE)),
  (2, 'nd000002-0000-4000-8000-000000000002', 2, 1, 'in_app', 7, 'delivered', DATE_SUB(NOW(6), INTERVAL 4 HOUR)),
  (3, 'nd000003-0000-4000-8000-000000000003', 3, 1, 'in_app', 10, 'delivered', DATE_SUB(NOW(6), INTERVAL 1 DAY)),
  (4, 'nd000004-0000-4000-8000-000000000004', 4, 1, 'in_app', 4, 'delivered', DATE_SUB(NOW(6), INTERVAL 2 DAY)),
  (5, 'nd000005-0000-4000-8000-000000000005', 5, 1, 'in_app', 6, 'delivered', DATE_SUB(NOW(6), INTERVAL 3 HOUR)),
  (6, 'nd000006-0000-4000-8000-000000000006', 6, 1, 'in_app', 8, 'delivered', DATE_SUB(NOW(6), INTERVAL 30 MINUTE))
ON DUPLICATE KEY UPDATE status = VALUES(status);
