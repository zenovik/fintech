-- Drop authentication module tables (reverse dependency order)
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS sso_identities;
DROP TABLE IF EXISTS auth_audit_logs;
DROP TABLE IF EXISTS login_attempts;
DROP TABLE IF EXISTS otp_verifications;
DROP TABLE IF EXISTS auth_challenges;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS trusted_devices;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS password_history;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;
