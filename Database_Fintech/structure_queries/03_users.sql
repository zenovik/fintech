-- =============================================================================
-- 03_users.sql
-- Core users table (authentication module)
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  email           VARCHAR(255)        NOT NULL,
  password_hash   VARCHAR(255)        NULL COMMENT 'NULL for SSO-only accounts',
  first_name      VARCHAR(100)        NOT NULL,
  last_name       VARCHAR(100)        NOT NULL,
  phone_number    VARCHAR(20)         NULL,
  phone_verified_at DATETIME          NULL,
  email_verified_at DATETIME          NULL,
  mfa_enabled     TINYINT(1)          NOT NULL DEFAULT 0,
  mfa_method      ENUM('none', 'totp', 'sms', 'both') NOT NULL DEFAULT 'none',
  totp_secret     VARCHAR(512)        NULL COMMENT 'Encrypted TOTP secret',
  status          ENUM('active', 'locked', 'pending', 'inactive') NOT NULL DEFAULT 'pending',
  failed_login_attempts INT UNSIGNED  NOT NULL DEFAULT 0,
  locked_until    DATETIME            NULL,
  password_changed_at DATETIME        NULL,
  last_login_at   DATETIME            NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_uuid (uuid),
  UNIQUE KEY uk_users_email (email),
  KEY idx_users_status (status),
  KEY idx_users_deleted_at (deleted_at),
  KEY idx_users_locked_until (locked_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
