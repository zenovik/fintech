-- =============================================================================
-- 37_dummy_data_invoices.sql
-- Invoices RBAC (volume data in 50_enterprise_demo_data.sql)
-- =============================================================================

USE fintech_db;

INSERT INTO permissions (id, uuid, code, name, module, description) VALUES
  (52, 'p1000052-0000-4000-8000-000000000052', 'invoices:read',   'View Invoices',   'invoices', 'View invoice dashboard and details'),
  (53, 'p1000053-0000-4000-8000-000000000053', 'invoices:write',  'Manage Invoices', 'invoices', 'Create and edit invoices'),
  (54, 'p1000054-0000-4000-8000-000000000054', 'invoices:manage', 'Admin Invoices',  'invoices', 'Void, cancel, and send invoices')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
  (1, 52, 1), (1, 53, 1), (1, 54, 1),
  (2, 52, 1), (2, 53, 1), (2, 54, 1);

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
  (3, 52, 1), (3, 53, 1);

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
  (4, 52, 1);

INSERT INTO audit_actions (id, uuid, code, name, category_code, description, risk_level) VALUES
  (47, 'aa100047-0000-4000-8000-000000000047', 'invoice_created',   'Invoice Created',   'transactions', 'New invoice created', 'low'),
  (48, 'aa100048-0000-4000-8000-000000000048', 'invoice_updated',   'Invoice Updated',   'transactions', 'Invoice updated', 'low'),
  (49, 'aa100049-0000-4000-8000-000000000049', 'invoice_sent',      'Invoice Sent',      'transactions', 'Invoice sent to customer', 'low'),
  (50, 'aa100050-0000-4000-8000-000000000050', 'invoice_paid',      'Invoice Paid',      'transactions', 'Invoice fully or partially paid', 'medium'),
  (51, 'aa100051-0000-4000-8000-000000000051', 'invoice_cancelled', 'Invoice Cancelled', 'transactions', 'Invoice cancelled', 'medium'),
  (52, 'aa100052-0000-4000-8000-000000000052', 'invoice_voided',    'Invoice Voided',    'transactions', 'Invoice voided', 'high')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO notification_events (id, uuid, code, name, description, category, is_enabled) VALUES
  (39, 'ne100039-0000-4000-8000-000000000039', 'invoice_created',  'Invoice Created',  'A new invoice was created', 'financial', 1),
  (40, 'ne100040-0000-4000-8000-000000000040', 'invoice_sent',     'Invoice Sent',     'An invoice was sent to a customer', 'financial', 1),
  (41, 'ne100041-0000-4000-8000-000000000041', 'invoice_viewed',   'Invoice Viewed',   'A customer viewed an invoice', 'financial', 1),
  (42, 'ne100042-0000-4000-8000-000000000042', 'invoice_reminder', 'Invoice Reminder', 'Payment reminder for an invoice', 'financial', 1),
  (43, 'ne100043-0000-4000-8000-000000000043', 'invoice_paid',     'Invoice Paid',     'An invoice was paid', 'financial', 1),
  (44, 'ne100044-0000-4000-8000-000000000044', 'invoice_overdue',  'Invoice Overdue',  'An invoice is overdue', 'financial', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);
