-- =============================================================================
-- 35_dummy_data_payouts.sql
-- Payouts RBAC permissions (volume data in 50_enterprise_demo_data.sql)
-- =============================================================================

USE fintech_db;

INSERT INTO permissions (id, uuid, code, name, module, description) VALUES
  (46, 'p1000046-0000-4000-8000-000000000046', 'payouts:read',   'View Payouts',   'payouts', 'View payout queue and details'),
  (47, 'p1000047-0000-4000-8000-000000000047', 'payouts:write',  'Manage Payouts', 'payouts', 'Create, schedule, and retry payouts'),
  (48, 'p1000048-0000-4000-8000-000000000048', 'payouts:approve','Approve Payouts','payouts', 'Approve pending payout requests')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
  (1, 46, 1), (1, 47, 1), (1, 48, 1),
  (2, 46, 1), (2, 47, 1), (2, 48, 1);

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
  (3, 46, 1), (3, 47, 1), (3, 48, 1);

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
  (4, 46, 1);

INSERT INTO audit_actions (id, uuid, code, name, category_code, description, risk_level) VALUES
  (39, 'aa100039-0000-4000-8000-000000000039', 'payout_request',  'Payout Requested',  'settlements', 'New payout request submitted', 'medium'),
  (40, 'aa100040-0000-4000-8000-000000000040', 'payout_approve',  'Payout Approved',   'settlements', 'Payout approved for processing', 'medium'),
  (41, 'aa100041-0000-4000-8000-000000000041', 'payout_sent',     'Payout Sent',       'settlements', 'Payout sent to bank', 'high'),
  (42, 'aa100042-0000-4000-8000-000000000042', 'payout_failed',   'Payout Failed',     'settlements', 'Payout transfer failed', 'high')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO notification_events (id, uuid, code, name, description, category, is_enabled) VALUES
  (18, 'ne100018-0000-4000-8000-000000000018', 'payout_scheduled', 'Payout Scheduled', 'Payout scheduled for future disbursement', 'financial', 1),
  (19, 'ne100019-0000-4000-8000-000000000019', 'payout_completed', 'Payout Completed', 'Payout confirmed by bank', 'financial', 1),
  (20, 'ne100020-0000-4000-8000-000000000020', 'payout_failed',    'Payout Failed',    'Payout transfer failed', 'financial', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);
