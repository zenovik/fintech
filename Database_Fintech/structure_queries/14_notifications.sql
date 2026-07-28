-- =============================================================================
-- 14_notifications.sql
-- Enterprise Notification Center — schema
-- =============================================================================

USE fintech_db;

-- ---------------------------------------------------------------------------
-- Delivery channels (email, push, sms, in_app)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_channels (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)        NOT NULL,
  code            VARCHAR(32)     NOT NULL,
  name            VARCHAR(100)    NOT NULL,
  description     VARCHAR(255)    NULL,
  is_enabled      TINYINT(1)      NOT NULL DEFAULT 1,
  config_json     JSON            NULL,
  created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_notification_channels_uuid (uuid),
  UNIQUE KEY uk_notification_channels_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Event types (welcome, merchant_approved, refund, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_events (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)        NOT NULL,
  code            VARCHAR(64)     NOT NULL,
  name            VARCHAR(150)    NOT NULL,
  category        ENUM('financial','security','system','support','merchant','transaction') NOT NULL DEFAULT 'system',
  description     TEXT            NULL,
  default_template_id BIGINT UNSIGNED NULL,
  is_enabled      TINYINT(1)      NOT NULL DEFAULT 1,
  created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_notification_events_uuid (uuid),
  UNIQUE KEY uk_notification_events_code (code),
  KEY idx_notification_events_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Reusable templates per event/channel
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_templates (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)        NOT NULL,
  code            VARCHAR(64)     NOT NULL,
  name            VARCHAR(150)    NOT NULL,
  event_code      VARCHAR(64)     NOT NULL,
  channel         ENUM('email','push','sms','in_app') NOT NULL DEFAULT 'in_app',
  subject         VARCHAR(255)    NULL,
  body_template   TEXT            NOT NULL,
  category        ENUM('financial','security','system','support','merchant','transaction') NOT NULL DEFAULT 'system',
  is_active       TINYINT(1)      NOT NULL DEFAULT 1,
  created_by      BIGINT UNSIGNED NULL,
  updated_by      BIGINT UNSIGNED NULL,
  created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  deleted_at      DATETIME(6)     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_notification_templates_uuid (uuid),
  UNIQUE KEY uk_notification_templates_code (code),
  KEY idx_notification_templates_event (event_code),
  KEY idx_notification_templates_deleted (deleted_at),
  CONSTRAINT fk_notification_templates_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_notification_templates_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE notification_events
  ADD CONSTRAINT fk_notification_events_default_template
  FOREIGN KEY (default_template_id) REFERENCES notification_templates (id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Audience groups for broadcasts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_groups (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)        NOT NULL,
  code            VARCHAR(64)     NOT NULL,
  name            VARCHAR(150)    NOT NULL,
  description     TEXT            NULL,
  criteria_json   JSON            NULL,
  is_system       TINYINT(1)      NOT NULL DEFAULT 0,
  created_by      BIGINT UNSIGNED NULL,
  created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  deleted_at      DATETIME(6)     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_notification_groups_uuid (uuid),
  UNIQUE KEY uk_notification_groups_code (code),
  KEY idx_notification_groups_deleted (deleted_at),
  CONSTRAINT fk_notification_groups_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- User inbox notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid                CHAR(36)        NOT NULL,
  user_id             BIGINT UNSIGNED NOT NULL,
  event_code          VARCHAR(64)     NOT NULL,
  category            ENUM('financial','security','system','support','merchant','transaction') NOT NULL DEFAULT 'system',
  title               VARCHAR(255)    NOT NULL,
  body                TEXT            NOT NULL,
  priority            ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
  status              ENUM('unread','read','archived') NOT NULL DEFAULT 'unread',
  icon                VARCHAR(64)     NULL,
  action_url          VARCHAR(512)    NULL,
  action_label        VARCHAR(100)    NULL,
  metadata_json       JSON            NULL,
  related_entity_type VARCHAR(64)     NULL,
  related_entity_id   BIGINT UNSIGNED NULL,
  group_id            BIGINT UNSIGNED NULL,
  broadcast_id        CHAR(36)        NULL,
  read_at             DATETIME(6)     NULL,
  archived_at         DATETIME(6)     NULL,
  created_at          DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at          DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  deleted_at          DATETIME(6)     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_notifications_uuid (uuid),
  KEY idx_notifications_user_status (user_id, status),
  KEY idx_notifications_user_created (user_id, created_at),
  KEY idx_notifications_event (event_code),
  KEY idx_notifications_category (category),
  KEY idx_notifications_broadcast (broadcast_id),
  KEY idx_notifications_deleted (deleted_at),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_group FOREIGN KEY (group_id) REFERENCES notification_groups (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Per-channel delivery tracking
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_deliveries (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)        NOT NULL,
  notification_id BIGINT UNSIGNED NOT NULL,
  user_id         BIGINT UNSIGNED NOT NULL,
  channel         ENUM('email','push','sms','in_app') NOT NULL DEFAULT 'in_app',
  template_id     BIGINT UNSIGNED NULL,
  status          ENUM('pending','sent','delivered','failed') NOT NULL DEFAULT 'pending',
  error_message   VARCHAR(512)    NULL,
  sent_at         DATETIME(6)     NULL,
  delivered_at    DATETIME(6)     NULL,
  created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_notification_deliveries_uuid (uuid),
  KEY idx_notification_deliveries_notification (notification_id),
  KEY idx_notification_deliveries_user (user_id),
  KEY idx_notification_deliveries_status (status),
  CONSTRAINT fk_notification_deliveries_notification FOREIGN KEY (notification_id) REFERENCES notifications (id) ON DELETE CASCADE,
  CONSTRAINT fk_notification_deliveries_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_notification_deliveries_template FOREIGN KEY (template_id) REFERENCES notification_templates (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
