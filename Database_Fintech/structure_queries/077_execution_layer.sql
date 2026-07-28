-- =============================================================================
-- 077_execution_layer.sql
-- Execution layer: encrypted secrets, email delivery tracking (additive)
-- =============================================================================

ALTER TABLE merchant_webhooks
  ADD COLUMN secret_encrypted VARCHAR(512) NULL AFTER secret_hash;

ALTER TABLE smtp_settings
  ADD COLUMN password_encrypted_v2 VARCHAR(512) NULL AFTER password_encrypted;

CREATE TABLE IF NOT EXISTS email_delivery_log (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  organization_id BIGINT UNSIGNED     NULL,
  job_id          BIGINT UNSIGNED     NULL,
  recipient       VARCHAR(255)        NOT NULL,
  subject         VARCHAR(500)        NOT NULL,
  template_type   VARCHAR(50)         NULL,
  status          ENUM('queued','sent','failed','dead_letter') NOT NULL DEFAULT 'queued',
  attempt_count   TINYINT UNSIGNED    NOT NULL DEFAULT 0,
  last_error      VARCHAR(500)        NULL,
  correlation_id  VARCHAR(64)         NULL,
  sent_at         DATETIME            NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_email_delivery_uuid (uuid),
  KEY idx_email_delivery_status (status, created_at),
  KEY idx_email_delivery_job (job_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
