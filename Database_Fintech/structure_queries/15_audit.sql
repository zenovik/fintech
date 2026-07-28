-- =============================================================================
-- 15_audit.sql
-- Enterprise Audit & Activity Log — schema
-- =============================================================================

USE fintech_db;

-- ---------------------------------------------------------------------------
-- Audit categories (Authentication, Users, Settings, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_categories (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)        NOT NULL,
  code            VARCHAR(64)     NOT NULL,
  name            VARCHAR(150)    NOT NULL,
  description     VARCHAR(255)    NULL,
  icon            VARCHAR(64)     NULL,
  sort_order      INT             NOT NULL DEFAULT 0,
  is_active       TINYINT(1)      NOT NULL DEFAULT 1,
  created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_audit_categories_uuid (uuid),
  UNIQUE KEY uk_audit_categories_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Audit actions (login, create, update, delete, export, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_actions (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)        NOT NULL,
  code            VARCHAR(64)     NOT NULL,
  name            VARCHAR(150)    NOT NULL,
  category_code   VARCHAR(64)     NOT NULL,
  description     VARCHAR(255)    NULL,
  risk_level      ENUM('low','medium','high','critical') NOT NULL DEFAULT 'low',
  is_active       TINYINT(1)      NOT NULL DEFAULT 1,
  created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_audit_actions_uuid (uuid),
  UNIQUE KEY uk_audit_actions_code (code),
  KEY idx_audit_actions_category (category_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Central audit log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)        NOT NULL,
  correlation_id  CHAR(36)        NOT NULL,
  user_id         BIGINT UNSIGNED NULL,
  actor_name      VARCHAR(255)    NULL,
  session_id      BIGINT UNSIGNED NULL,
  module          VARCHAR(64)     NOT NULL,
  category_code   VARCHAR(64)     NOT NULL,
  action_code     VARCHAR(64)     NOT NULL,
  entity_type     VARCHAR(64)     NULL,
  entity_id       VARCHAR(100)    NULL,
  description     TEXT            NOT NULL,
  ip_address      VARCHAR(45)     NULL,
  user_agent      VARCHAR(512)    NULL,
  risk_level      ENUM('low','medium','high','critical') NOT NULL DEFAULT 'low',
  before_values   JSON            NULL,
  after_values    JSON            NULL,
  created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_audit_logs_uuid (uuid),
  KEY idx_audit_logs_correlation (correlation_id),
  KEY idx_audit_logs_user (user_id),
  KEY idx_audit_logs_module (module),
  KEY idx_audit_logs_category (category_code),
  KEY idx_audit_logs_action (action_code),
  KEY idx_audit_logs_entity (entity_type, entity_id),
  KEY idx_audit_logs_created (created_at),
  KEY idx_audit_logs_risk (risk_level),
  CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_audit_logs_session FOREIGN KEY (session_id) REFERENCES user_sessions (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Extended metadata key/value pairs per audit log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_metadata (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  audit_log_id    BIGINT UNSIGNED NOT NULL,
  meta_key        VARCHAR(128)    NOT NULL,
  meta_value      TEXT            NULL,
  created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_audit_metadata_log (audit_log_id),
  KEY idx_audit_metadata_key (meta_key),
  CONSTRAINT fk_audit_metadata_log FOREIGN KEY (audit_log_id) REFERENCES audit_logs (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- API request logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_logs (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)        NOT NULL,
  correlation_id  CHAR(36)        NULL,
  user_id         BIGINT UNSIGNED NULL,
  method          VARCHAR(10)     NOT NULL,
  path            VARCHAR(512)    NOT NULL,
  status_code     INT             NOT NULL,
  ip_address      VARCHAR(45)     NULL,
  user_agent      VARCHAR(512)    NULL,
  request_body    JSON            NULL,
  response_time_ms INT            NULL,
  error_message   VARCHAR(512)    NULL,
  created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_api_logs_uuid (uuid),
  KEY idx_api_logs_user (user_id),
  KEY idx_api_logs_path (path(191)),
  KEY idx_api_logs_status (status_code),
  KEY idx_api_logs_created (created_at),
  KEY idx_api_logs_correlation (correlation_id),
  CONSTRAINT fk_api_logs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Webhook delivery logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS webhook_logs (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)        NOT NULL,
  correlation_id  CHAR(36)        NULL,
  event_type      VARCHAR(128)    NOT NULL,
  url             VARCHAR(512)    NOT NULL,
  status          ENUM('pending','success','failed','retrying') NOT NULL DEFAULT 'pending',
  status_code     INT             NULL,
  payload         JSON            NULL,
  response_body   TEXT            NULL,
  error_message   VARCHAR(512)    NULL,
  attempt_count   INT             NOT NULL DEFAULT 1,
  delivered_at    DATETIME(6)     NULL,
  created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_webhook_logs_uuid (uuid),
  KEY idx_webhook_logs_event (event_type),
  KEY idx_webhook_logs_status (status),
  KEY idx_webhook_logs_created (created_at),
  KEY idx_webhook_logs_correlation (correlation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
