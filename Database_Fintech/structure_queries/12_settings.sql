-- =============================================================================
-- 12_settings.sql
-- Application settings (organization, branding, security, notifications, flags)
-- =============================================================================

USE fintech_db;

-- Organization / business profile (singleton)
CREATE TABLE IF NOT EXISTS organization_settings (
  id                          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid                        CHAR(36)        NOT NULL,
  legal_name                  VARCHAR(255)    NOT NULL DEFAULT 'Merchant Pro Inc.',
  dba_name                    VARCHAR(255)    NULL,
  tax_id                      VARCHAR(64)     NULL,
  address_line1               VARCHAR(255)    NULL,
  address_line2               VARCHAR(255)    NULL,
  city                        VARCHAR(128)    NULL,
  state                       VARCHAR(128)    NULL,
  postal_code                 VARCHAR(32)     NULL,
  country                     VARCHAR(64)     NULL DEFAULT 'US',
  base_currency               CHAR(3)         NOT NULL DEFAULT 'USD',
  timezone                    VARCHAR(64)     NOT NULL DEFAULT 'UTC',
  primary_region              VARCHAR(64)     NULL DEFAULT 'Global',
  public_profile_enabled      TINYINT(1)      NOT NULL DEFAULT 0,
  payout_notifications_enabled TINYINT(1)     NOT NULL DEFAULT 1,
  created_at                  DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at                  DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by                  BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_organization_settings_uuid (uuid),
  CONSTRAINT fk_organization_settings_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Branding (singleton)
CREATE TABLE IF NOT EXISTS branding_settings (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)        NOT NULL,
  company_name    VARCHAR(255)    NOT NULL DEFAULT 'Merchant Pro',
  logo_url        VARCHAR(512)    NULL,
  logo_initials   VARCHAR(8)      NULL DEFAULT 'MP',
  primary_color   VARCHAR(16)     NOT NULL DEFAULT '#003ec7',
  secondary_color VARCHAR(16)     NOT NULL DEFAULT '#1e40af',
  accent_color    VARCHAR(16)     NOT NULL DEFAULT '#22c55e',
  favicon_url     VARCHAR(512)    NULL,
  created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by      BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_branding_settings_uuid (uuid),
  CONSTRAINT fk_branding_settings_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Security policy (singleton)
CREATE TABLE IF NOT EXISTS security_settings (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid                  CHAR(36)        NOT NULL,
  mfa_enforced          TINYINT(1)      NOT NULL DEFAULT 0,
  mfa_methods_allowed   JSON            NOT NULL,
  ip_whitelist_enabled  TINYINT(1)      NOT NULL DEFAULT 0,
  ip_whitelist          JSON            NULL,
  created_at            DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at            DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by            BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_security_settings_uuid (uuid),
  CONSTRAINT fk_security_settings_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password policy (singleton)
CREATE TABLE IF NOT EXISTS password_policy (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid               CHAR(36)        NOT NULL,
  min_length         INT UNSIGNED    NOT NULL DEFAULT 8,
  require_uppercase  TINYINT(1)      NOT NULL DEFAULT 1,
  require_lowercase  TINYINT(1)      NOT NULL DEFAULT 1,
  require_number     TINYINT(1)      NOT NULL DEFAULT 1,
  require_special    TINYINT(1)      NOT NULL DEFAULT 1,
  max_age_days       INT UNSIGNED    NOT NULL DEFAULT 90,
  history_count      INT UNSIGNED    NOT NULL DEFAULT 5,
  created_at         DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at         DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by         BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_password_policy_uuid (uuid),
  CONSTRAINT fk_password_policy_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Session management (singleton)
CREATE TABLE IF NOT EXISTS session_settings (
  id                         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid                       CHAR(36)        NOT NULL,
  idle_timeout_minutes       INT UNSIGNED    NOT NULL DEFAULT 15,
  max_session_duration_minutes INT UNSIGNED  NOT NULL DEFAULT 480,
  max_concurrent_sessions    INT UNSIGNED    NOT NULL DEFAULT 5,
  remember_device_days       INT UNSIGNED    NOT NULL DEFAULT 30,
  created_at                 DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at                 DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by                 BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_session_settings_uuid (uuid),
  CONSTRAINT fk_session_settings_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notification preferences (per user or system default when user_id IS NULL)
CREATE TABLE IF NOT EXISTS notification_preferences (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid              CHAR(36)        NOT NULL,
  user_id           BIGINT UNSIGNED NULL,
  notification_type VARCHAR(64)     NOT NULL,
  channel           ENUM('email', 'push', 'sms') NOT NULL,
  is_enabled        TINYINT(1)      NOT NULL DEFAULT 1,
  created_at        DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at        DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_notification_pref (user_id, notification_type, channel),
  UNIQUE KEY uk_notification_preferences_uuid (uuid),
  KEY idx_notification_preferences_user (user_id),
  CONSTRAINT fk_notification_preferences_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Feature flags (CRUD)
CREATE TABLE IF NOT EXISTS feature_flags (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid                CHAR(36)        NOT NULL,
  code                VARCHAR(64)     NOT NULL,
  name                VARCHAR(128)    NOT NULL,
  description         VARCHAR(512)    NULL,
  is_enabled          TINYINT(1)      NOT NULL DEFAULT 0,
  is_beta             TINYINT(1)      NOT NULL DEFAULT 0,
  rollout_percentage  TINYINT UNSIGNED NOT NULL DEFAULT 100,
  created_at          DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at          DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by          BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_feature_flags_code (code),
  UNIQUE KEY uk_feature_flags_uuid (uuid),
  KEY idx_feature_flags_enabled (is_enabled),
  CONSTRAINT fk_feature_flags_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Developer / API settings (singleton)
CREATE TABLE IF NOT EXISTS api_settings (
  id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid                    CHAR(36)        NOT NULL,
  api_base_url            VARCHAR(512)    NULL,
  webhook_retry_count     INT UNSIGNED    NOT NULL DEFAULT 3,
  webhook_timeout_seconds INT UNSIGNED    NOT NULL DEFAULT 30,
  rate_limit_per_minute   INT UNSIGNED    NOT NULL DEFAULT 120,
  created_at              DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at              DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by              BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_api_settings_uuid (uuid),
  CONSTRAINT fk_api_settings_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SMTP settings (singleton)
CREATE TABLE IF NOT EXISTS smtp_settings (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid              CHAR(36)        NOT NULL,
  host              VARCHAR(255)    NULL,
  port              INT UNSIGNED    NOT NULL DEFAULT 587,
  username          VARCHAR(255)    NULL,
  password_encrypted VARCHAR(512)   NULL,
  from_email        VARCHAR(255)    NULL,
  from_name         VARCHAR(255)    NULL,
  use_tls           TINYINT(1)      NOT NULL DEFAULT 1,
  created_at        DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at        DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by        BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_smtp_settings_uuid (uuid),
  CONSTRAINT fk_smtp_settings_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Storage settings (singleton)
CREATE TABLE IF NOT EXISTS storage_settings (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid                CHAR(36)        NOT NULL,
  provider            VARCHAR(64)     NOT NULL DEFAULT 'local',
  bucket_name         VARCHAR(255)    NULL,
  region              VARCHAR(64)     NULL,
  max_upload_mb       INT UNSIGNED    NOT NULL DEFAULT 10,
  allowed_extensions  JSON            NOT NULL,
  created_at          DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at          DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by          BIGINT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_storage_settings_uuid (uuid),
  CONSTRAINT fk_storage_settings_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
