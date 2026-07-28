-- =============================================================================
-- 33_dummy_data_refunds.sql
-- Refunds RBAC permissions (volume data in 50_enterprise_demo_data.sql)
-- =============================================================================

USE fintech_db;

INSERT INTO permissions (id, uuid, code, name, module, description) VALUES
  (40, 'p1000040-0000-4000-8000-000000000040', 'refunds:read',    'View Refunds',     'refunds', 'View refund queue and history'),
  (41, 'p1000041-0000-4000-8000-000000000041', 'refunds:write',   'Request Refunds',  'refunds', 'Submit refund requests'),
  (42, 'p1000042-0000-4000-8000-000000000042', 'refunds:approve', 'Approve Refunds',  'refunds', 'Approve or reject refund requests')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
  (1, 40, 1), (1, 41, 1), (1, 42, 1),
  (2, 40, 1), (2, 41, 1), (2, 42, 1);

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
  (3, 40, 1), (3, 41, 1);

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
  (4, 40, 1);

INSERT INTO audit_actions (id, uuid, code, name, category_code, description, risk_level) VALUES
  (32, 'aa100032-0000-4000-8000-000000000032', 'refund_request',  'Refund Requested',  'transactions', 'Refund request submitted', 'low'),
  (33, 'aa100033-0000-4000-8000-000000000033', 'refund_approve',  'Refund Approved',   'transactions', 'Refund request approved', 'medium'),
  (34, 'aa100034-0000-4000-8000-000000000034', 'refund_reject',   'Refund Rejected',   'transactions', 'Refund request rejected', 'medium')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO notification_events (id, uuid, code, name, description, category, is_enabled) VALUES
  (13, 'ne100013-0000-4000-8000-000000000013', 'refund_requested', 'Refund Requested', 'Refund request submitted for approval', 'financial', 1),
  (14, 'ne100014-0000-4000-8000-000000000014', 'refund_rejected',  'Refund Rejected',  'Refund request was rejected', 'financial', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);
