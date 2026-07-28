-- =============================================================================
-- 36_dummy_data_payment_links.sql
-- Payment Links RBAC (volume data in 50_enterprise_demo_data.sql)
-- =============================================================================

USE fintech_db;

INSERT INTO permissions (id, uuid, code, name, module, description) VALUES
  (49, 'p1000049-0000-4000-8000-000000000049', 'payment_links:read',   'View Payment Links',   'payment_links', 'View payment link dashboard and details'),
  (50, 'p1000050-0000-4000-8000-000000000050', 'payment_links:write',  'Manage Payment Links', 'payment_links', 'Create and edit payment links'),
  (51, 'p1000051-0000-4000-8000-000000000051', 'payment_links:manage', 'Admin Payment Links',  'payment_links', 'Disable, expire, and regenerate payment links')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
  (1, 49, 1), (1, 50, 1), (1, 51, 1),
  (2, 49, 1), (2, 50, 1), (2, 51, 1);

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
  (3, 49, 1), (3, 50, 1);

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
  (4, 49, 1);

INSERT INTO audit_actions (id, uuid, code, name, category_code, description, risk_level) VALUES
  (43, 'aa100043-0000-4000-8000-000000000043', 'payment_link_created',  'Payment Link Created',  'transactions', 'New payment link created', 'low'),
  (44, 'aa100044-0000-4000-8000-000000000044', 'payment_link_updated',  'Payment Link Updated',  'transactions', 'Payment link settings updated', 'low'),
  (45, 'aa100045-0000-4000-8000-000000000045', 'payment_link_disabled', 'Payment Link Disabled', 'transactions', 'Payment link disabled or expired', 'medium'),
  (46, 'aa100046-0000-4000-8000-000000000046', 'payment_link_paid',     'Payment Link Paid',     'transactions', 'Payment received via payment link', 'medium')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO notification_events (id, uuid, code, name, description, category, is_enabled) VALUES
  (36, 'ne100036-0000-4000-8000-000000000036', 'payment_link_created',  'Payment Link Created',  'A new payment link was created', 'financial', 1),
  (37, 'ne100037-0000-4000-8000-000000000037', 'payment_link_expired',  'Payment Link Expired',  'A payment link has expired', 'financial', 1),
  (38, 'ne100038-0000-4000-8000-000000000038', 'payment_received',      'Payment Received',      'Payment received via payment link', 'financial', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);
