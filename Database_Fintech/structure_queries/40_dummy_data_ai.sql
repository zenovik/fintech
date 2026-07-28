-- =============================================================================
-- 40_dummy_data_ai.sql
-- AI Foundation RBAC + audit seed
-- =============================================================================

USE fintech_db;

INSERT INTO permissions (id, uuid, code, name, module, description) VALUES
  (67, 'p1000067-0000-4000-8000-000000000067', 'ai:view', 'View AI Assistant', 'ai', 'Access the AI assistant panel'),
  (68, 'p1000068-0000-4000-8000-000000000068', 'ai:chat', 'Use AI Chat',       'ai', 'Send messages to the AI assistant')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
  (1, 67, 1), (1, 68, 1),
  (2, 67, 1), (2, 68, 1),
  (3, 67, 1), (3, 68, 1),
  (4, 67, 1), (4, 68, 1),
  (6, 67, 1), (6, 68, 1);

INSERT INTO audit_actions (id, uuid, code, name, category_code, description, risk_level) VALUES
  (73, 'aa100073-0000-4000-8000-000000000073', 'ai_chat_request',  'AI Chat Request',  'system', 'User sent a message to the AI assistant', 'low'),
  (74, 'aa100074-0000-4000-8000-000000000074', 'ai_chat_response', 'AI Chat Response', 'system', 'AI assistant returned a response', 'low')
ON DUPLICATE KEY UPDATE name = VALUES(name);
