-- =============================================================================
-- 39_dummy_data_support_operations.sql
-- Support & Operations RBAC (volume data in 50_enterprise_demo_data.sql)
-- =============================================================================

USE fintech_db;

INSERT INTO permissions (id, uuid, code, name, module, description) VALUES
  (61, 'p1000061-0000-4000-8000-000000000061', 'support:read',   'View Support',   'support', 'View support tickets and dashboard'),
  (62, 'p1000062-0000-4000-8000-000000000062', 'support:write',  'Manage Support', 'support', 'Create and edit support tickets'),
  (63, 'p1000063-0000-4000-8000-000000000063', 'support:manage', 'Admin Support',  'support', 'Assign, escalate, close and reopen tickets'),
  (64, 'p1000064-0000-4000-8000-000000000064', 'operations:read',   'View Operations',   'operations', 'View operations dashboard and incidents'),
  (65, 'p1000065-0000-4000-8000-000000000065', 'operations:write',  'Manage Operations', 'operations', 'Acknowledge alerts and manage incidents'),
  (66, 'p1000066-0000-4000-8000-000000000066', 'operations:manage', 'Admin Operations',  'operations', 'Retry queue, background jobs, manual retry')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
  (1, 61, 1), (1, 62, 1), (1, 63, 1), (1, 64, 1), (1, 65, 1), (1, 66, 1),
  (2, 61, 1), (2, 62, 1), (2, 63, 1), (2, 64, 1), (2, 65, 1), (2, 66, 1);

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
  (4, 61, 1), (4, 62, 1), (4, 63, 1), (4, 64, 1), (4, 65, 1), (4, 66, 1),
  (6, 61, 1), (6, 62, 1), (6, 63, 1);

INSERT INTO audit_actions (id, uuid, code, name, category_code, description, risk_level) VALUES
  (63, 'aa100063-0000-4000-8000-000000000063', 'ticket_created',    'Ticket Created',    'support', 'Support ticket created', 'low'),
  (64, 'aa100064-0000-4000-8000-000000000064', 'ticket_updated',    'Ticket Updated',    'support', 'Support ticket updated', 'low'),
  (65, 'aa100065-0000-4000-8000-000000000065', 'ticket_assigned',   'Ticket Assigned',   'support', 'Support ticket assigned', 'low'),
  (66, 'aa100066-0000-4000-8000-000000000066', 'ticket_escalated',  'Ticket Escalated',  'support', 'Support ticket escalated', 'medium'),
  (67, 'aa100067-0000-4000-8000-000000000067', 'ticket_closed',     'Ticket Closed',     'support', 'Support ticket closed', 'low'),
  (68, 'aa100068-0000-4000-8000-000000000068', 'ticket_reopened',   'Ticket Reopened',   'support', 'Support ticket reopened', 'medium'),
  (69, 'aa100069-0000-4000-8000-000000000069', 'incident_created',  'Incident Created',  'system', 'Operations incident created', 'high'),
  (70, 'aa100070-0000-4000-8000-000000000070', 'incident_resolved', 'Incident Resolved', 'system', 'Operations incident resolved', 'medium'),
  (71, 'aa100071-0000-4000-8000-000000000071', 'retry_queued',      'Retry Queued',      'system', 'Item added to retry queue', 'low'),
  (72, 'aa100072-0000-4000-8000-000000000072', 'retry_executed',    'Retry Executed',    'system', 'Manual or automatic retry executed', 'medium')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO notification_events (id, uuid, code, name, description, category, is_enabled) VALUES
  (51, 'ne100051-0000-4000-8000-000000000051', 'ticket_created',      'Ticket Created',      'A new support ticket was created', 'support', 1),
  (52, 'ne100052-0000-4000-8000-000000000052', 'ticket_assigned',     'Ticket Assigned',     'A support ticket was assigned to you', 'support', 1),
  (53, 'ne100053-0000-4000-8000-000000000053', 'ticket_escalated',    'Ticket Escalated',    'A support ticket was escalated', 'support', 1),
  (54, 'ne100054-0000-4000-8000-000000000054', 'ticket_sla_breach',   'Ticket SLA Breach',   'A support ticket breached SLA', 'support', 1),
  (55, 'ne100055-0000-4000-8000-000000000055', 'system_alert',        'System Alert',        'A new system alert was raised', 'system', 1),
  (56, 'ne100056-0000-4000-8000-000000000056', 'incident_opened',     'Incident Opened',     'An operations incident was opened', 'system', 1),
  (57, 'ne100057-0000-4000-8000-000000000057', 'retry_failed',        'Retry Failed',        'A retry queue item failed', 'system', 1),
  (58, 'ne100058-0000-4000-8000-000000000058', 'background_job_failed','Background Job Failed','A background job failed', 'system', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);
