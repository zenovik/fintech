-- =============================================================================
-- 01_lookup_tables.sql
-- Shared lookup / reference tables
-- =============================================================================

CREATE TABLE IF NOT EXISTS regions (
  id              TINYINT UNSIGNED    NOT NULL AUTO_INCREMENT,
  code            VARCHAR(10)         NOT NULL,
  name            VARCHAR(100)        NOT NULL,
  display_order   TINYINT UNSIGNED    NOT NULL DEFAULT 0,
  is_active       TINYINT(1)          NOT NULL DEFAULT 1,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_regions_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_method_types (
  id              TINYINT UNSIGNED    NOT NULL AUTO_INCREMENT,
  code            VARCHAR(30)         NOT NULL,
  name            VARCHAR(100)        NOT NULL,
  icon_key        VARCHAR(50)         NOT NULL,
  is_active       TINYINT(1)          NOT NULL DEFAULT 1,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_payment_method_types_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transaction_statuses (
  id              TINYINT UNSIGNED    NOT NULL AUTO_INCREMENT,
  code            VARCHAR(20)         NOT NULL,
  label           VARCHAR(50)         NOT NULL,
  badge_color     VARCHAR(30)         NOT NULL,
  display_order   TINYINT UNSIGNED    NOT NULL DEFAULT 0,
  is_active       TINYINT(1)          NOT NULL DEFAULT 1,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_transaction_statuses_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity_event_types (
  id              TINYINT UNSIGNED    NOT NULL AUTO_INCREMENT,
  code            VARCHAR(40)         NOT NULL,
  name            VARCHAR(100)        NOT NULL,
  icon_key        VARCHAR(50)         NOT NULL,
  color_token     VARCHAR(30)         NOT NULL,
  is_active       TINYINT(1)          NOT NULL DEFAULT 1,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_activity_event_types_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS fraud_alert_severities (
  id              TINYINT UNSIGNED    NOT NULL AUTO_INCREMENT,
  code            VARCHAR(20)         NOT NULL,
  label           VARCHAR(50)         NOT NULL,
  color_token     VARCHAR(30)         NOT NULL,
  display_order   TINYINT UNSIGNED    NOT NULL DEFAULT 0,
  is_active       TINYINT(1)          NOT NULL DEFAULT 1,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_fraud_alert_severities_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dashboard_export_formats (
  id              TINYINT UNSIGNED    NOT NULL AUTO_INCREMENT,
  code            VARCHAR(10)         NOT NULL,
  name            VARCHAR(50)         NOT NULL,
  mime_type       VARCHAR(100)        NOT NULL,
  is_active       TINYINT(1)          NOT NULL DEFAULT 1,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_dashboard_export_formats_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
