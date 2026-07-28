-- =============================================================================
-- 32_dummy_data_customers.sql
-- Customers RBAC permissions (volume data in 50_enterprise_demo_data.sql)
-- =============================================================================

USE fintech_db;

INSERT INTO permissions (id, uuid, code, name, module, description) VALUES
  (37, 'p1000037-0000-4000-8000-000000000037', 'customers:read',   'View Customers',   'customers', 'View customer profiles and activity'),
  (38, 'p1000038-0000-4000-8000-000000000038', 'customers:write',  'Manage Customers', 'customers', 'Create and update customer records'),
  (39, 'p1000039-0000-4000-8000-000000000039', 'customers:delete', 'Delete Customers', 'customers', 'Archive or delete customer records')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
  (1, 37, 1), (1, 38, 1), (1, 39, 1),
  (2, 37, 1), (2, 38, 1), (2, 39, 1);

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
  (3, 37, 1);

INSERT INTO audit_categories (id, uuid, code, name, description, icon, sort_order) VALUES
  (12, 'ac100012-0000-4000-8000-000000000012', 'customers', 'Customers', 'Customer profile and lifecycle events', 'person', 12)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO audit_actions (id, uuid, code, name, category_code, description, risk_level) VALUES
  (28, 'aa100028-0000-4000-8000-000000000028', 'customer_create',  'Customer Created',  'customers', 'New customer record created', 'low'),
  (29, 'aa100029-0000-4000-8000-000000000029', 'customer_update',  'Customer Updated',  'customers', 'Customer profile updated', 'low'),
  (30, 'aa100030-0000-4000-8000-000000000030', 'customer_delete',  'Customer Deleted',  'customers', 'Customer record archived/deleted', 'medium'),
  (31, 'aa100031-0000-4000-8000-000000000031', 'customer_status',  'Customer Status',   'customers', 'Customer status changed', 'medium')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO notification_events (id, uuid, code, name, description, category, is_enabled) VALUES
  (11, 'ne100011-0000-4000-8000-000000000011', 'customer_created',       'Customer Created',       'Triggered when a new customer is registered', 'support', 1),
  (12, 'ne100012-0000-4000-8000-000000000012', 'customer_status_changed','Customer Status Changed','Triggered when customer status is updated', 'support', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);
