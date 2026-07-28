-- =============================================================================
-- 34_dummy_data_chargebacks.sql
-- Chargebacks RBAC permissions (volume data in 50_enterprise_demo_data.sql)
-- =============================================================================

USE fintech_db;

INSERT INTO permissions (id, uuid, code, name, module, description) VALUES
  (43, 'p1000043-0000-4000-8000-000000000043', 'chargebacks:read',   'View Chargebacks',   'chargebacks', 'View chargeback queue and details'),
  (44, 'p1000044-0000-4000-8000-000000000044', 'chargebacks:write',  'Manage Chargebacks', 'chargebacks', 'Submit evidence and representment'),
  (45, 'p1000045-0000-4000-8000-000000000045', 'chargebacks:resolve','Resolve Chargebacks','chargebacks', 'Record win/loss chargeback outcomes')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
  (1, 43, 1), (1, 44, 1), (1, 45, 1),
  (2, 43, 1), (2, 44, 1), (2, 45, 1);

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
  (3, 43, 1), (3, 44, 1);

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
  (4, 43, 1);

INSERT INTO audit_actions (id, uuid, code, name, category_code, description, risk_level) VALUES
  (35, 'aa100035-0000-4000-8000-000000000035', 'chargeback_open',         'Chargeback Opened',         'transactions', 'New chargeback received', 'high'),
  (36, 'aa100036-0000-4000-8000-000000000036', 'chargeback_evidence',     'Evidence Submitted',        'transactions', 'Chargeback evidence uploaded', 'medium'),
  (37, 'aa100037-0000-4000-8000-000000000037', 'chargeback_representment','Representment Submitted',   'transactions', 'Chargeback representment filed', 'medium'),
  (38, 'aa100038-0000-4000-8000-000000000038', 'chargeback_resolve',      'Chargeback Resolved',       'transactions', 'Chargeback win/loss recorded', 'high')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO notification_events (id, uuid, code, name, description, category, is_enabled) VALUES
  (15, 'ne100015-0000-4000-8000-000000000015', 'chargeback_opened',    'Chargeback Opened',    'New chargeback received against a transaction', 'financial', 1),
  (16, 'ne100016-0000-4000-8000-000000000016', 'chargeback_resolved',  'Chargeback Resolved',  'Chargeback outcome recorded (won/lost)', 'financial', 1),
  (17, 'ne100017-0000-4000-8000-000000000017', 'chargeback_evidence_due','Evidence Due Soon',  'Chargeback evidence deadline approaching', 'financial', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);
