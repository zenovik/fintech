-- Rollback roles & permissions tables
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS api_tokens;
DROP TABLE IF EXISTS login_history;
DROP TABLE IF EXISTS user_activity_logs;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
SET FOREIGN_KEY_CHECKS = 1;
