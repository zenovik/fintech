-- =============================================================================
-- 41_dummy_data_system.sql
-- System observability RBAC seed
-- =============================================================================

USE fintech_db;

INSERT INTO permissions (id, uuid, code, name, module, description) VALUES
  (69, 'p1000069-0000-4000-8000-000000000069', 'system:view', 'View System Status', 'system', 'View platform health, readiness, and version information')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
  (1, 69, 1),
  (2, 69, 1),
  (3, 69, 1),
  (4, 69, 1),
  (6, 69, 1);
