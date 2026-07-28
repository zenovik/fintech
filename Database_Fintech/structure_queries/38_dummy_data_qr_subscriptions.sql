-- =============================================================================
-- 38_dummy_data_qr_subscriptions.sql
-- QR + Subscriptions RBAC (volume data in 50_enterprise_demo_data.sql)
-- =============================================================================

USE fintech_db;

INSERT INTO permissions (id, uuid, code, name, module, description) VALUES
  (55, 'p1000055-0000-4000-8000-000000000055', 'qr_payments:read',   'View QR Payments',   'qr_payments', 'View QR payment dashboard and details'),
  (56, 'p1000056-0000-4000-8000-000000000056', 'qr_payments:write',  'Manage QR Payments', 'qr_payments', 'Create and edit QR codes'),
  (57, 'p1000057-0000-4000-8000-000000000057', 'qr_payments:manage', 'Admin QR Payments',  'qr_payments', 'Disable and regenerate QR codes'),
  (58, 'p1000058-0000-4000-8000-000000000058', 'subscriptions:read',   'View Subscriptions',   'subscriptions', 'View subscription dashboard and details'),
  (59, 'p1000059-0000-4000-8000-000000000059', 'subscriptions:write',  'Manage Subscriptions', 'subscriptions', 'Create and edit subscriptions'),
  (60, 'p1000060-0000-4000-8000-000000000060', 'subscriptions:manage', 'Admin Subscriptions',  'subscriptions', 'Pause, cancel, and renew subscriptions')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
  (1, 55, 1), (1, 56, 1), (1, 57, 1), (1, 58, 1), (1, 59, 1), (1, 60, 1),
  (2, 55, 1), (2, 56, 1), (2, 57, 1), (2, 58, 1), (2, 59, 1), (2, 60, 1);

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
  (3, 55, 1), (3, 56, 1), (3, 58, 1), (3, 59, 1);

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
  (4, 55, 1), (4, 58, 1);

INSERT INTO audit_actions (id, uuid, code, name, category_code, description, risk_level) VALUES
  (53, 'aa100053-0000-4000-8000-000000000053', 'qr_code_created',    'QR Code Created',    'transactions', 'New QR payment code created', 'low'),
  (54, 'aa100054-0000-4000-8000-000000000054', 'qr_code_updated',    'QR Code Updated',    'transactions', 'QR payment code updated', 'low'),
  (55, 'aa100055-0000-4000-8000-000000000055', 'qr_code_disabled',   'QR Code Disabled',   'transactions', 'QR payment code disabled', 'medium'),
  (56, 'aa100056-0000-4000-8000-000000000056', 'qr_code_paid',       'QR Code Paid',       'transactions', 'Payment received via QR scan', 'medium'),
  (57, 'aa100057-0000-4000-8000-000000000057', 'subscription_created',  'Subscription Created',  'transactions', 'New subscription created', 'low'),
  (58, 'aa100058-0000-4000-8000-000000000058', 'subscription_updated',  'Subscription Updated',  'transactions', 'Subscription updated', 'low'),
  (59, 'aa100059-0000-4000-8000-000000000059', 'subscription_paused',   'Subscription Paused',   'transactions', 'Subscription paused', 'medium'),
  (60, 'aa100060-0000-4000-8000-000000000060', 'subscription_cancelled','Subscription Cancelled','transactions', 'Subscription cancelled', 'medium'),
  (61, 'aa100061-0000-4000-8000-000000000061', 'subscription_renewed',  'Subscription Renewed',  'transactions', 'Subscription renewed', 'low'),
  (62, 'aa100062-0000-4000-8000-000000000062', 'subscription_failed',   'Subscription Failed',   'transactions', 'Subscription payment failed', 'high')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO notification_events (id, uuid, code, name, description, category, is_enabled) VALUES
  (45, 'ne100045-0000-4000-8000-000000000045', 'qr_code_created',       'QR Code Created',       'A new QR payment code was created', 'financial', 1),
  (46, 'ne100046-0000-4000-8000-000000000046', 'qr_payment_received',   'QR Payment Received',   'Payment received via QR scan', 'financial', 1),
  (47, 'ne100047-0000-4000-8000-000000000047', 'subscription_created',  'Subscription Created',  'A new subscription was created', 'financial', 1),
  (48, 'ne100048-0000-4000-8000-000000000048', 'subscription_renewed',  'Subscription Renewed',  'A subscription was renewed', 'financial', 1),
  (49, 'ne100049-0000-4000-8000-000000000049', 'subscription_cancelled','Subscription Cancelled','A subscription was cancelled', 'financial', 1),
  (50, 'ne100050-0000-4000-8000-000000000050', 'subscription_failed',   'Subscription Failed',   'Subscription payment failed', 'financial', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);
