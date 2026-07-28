-- =============================================================================
-- 16_operations.sql
-- Operations: system alerts, incidents, retry queue, background jobs
-- =============================================================================

CREATE TABLE IF NOT EXISTS system_alerts (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  organization_id BIGINT UNSIGNED     NULL,
  alert_type      VARCHAR(64)         NOT NULL,
  severity        ENUM('info','warning','error','critical') NOT NULL DEFAULT 'warning',
  title           VARCHAR(255)        NOT NULL,
  message         TEXT                NOT NULL,
  source          VARCHAR(128)        NOT NULL DEFAULT 'system',
  status          ENUM('active','acknowledged','resolved') NOT NULL DEFAULT 'active',
  related_entity_type VARCHAR(64)     NULL,
  related_entity_id   VARCHAR(100)    NULL,
  acknowledged_by BIGINT UNSIGNED     NULL,
  acknowledged_at DATETIME            NULL,
  resolved_at     DATETIME            NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_system_alerts_uuid (uuid),
  KEY idx_system_alerts_org (organization_id),
  KEY idx_system_alerts_type (alert_type),
  KEY idx_system_alerts_severity (severity),
  KEY idx_system_alerts_status (status),
  KEY idx_system_alerts_created (created_at),
  CONSTRAINT fk_system_alerts_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_system_alerts_acknowledged_by
    FOREIGN KEY (acknowledged_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS operations_incidents (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  organization_id BIGINT UNSIGNED     NULL,
  incident_ref    VARCHAR(30)         NOT NULL,
  title           VARCHAR(255)        NOT NULL,
  description     TEXT                NULL,
  severity        ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  status          ENUM('open','investigating','mitigated','resolved','closed') NOT NULL DEFAULT 'open',
  impact_summary  VARCHAR(512)        NULL,
  started_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at     DATETIME            NULL,
  created_by      BIGINT UNSIGNED     NULL,
  updated_by      BIGINT UNSIGNED     NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_operations_incidents_uuid (uuid),
  UNIQUE KEY uk_operations_incidents_ref (incident_ref),
  KEY idx_operations_incidents_org (organization_id),
  KEY idx_operations_incidents_status (status),
  KEY idx_operations_incidents_severity (severity),
  CONSTRAINT fk_operations_incidents_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_operations_incidents_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_operations_incidents_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS retry_queue (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  organization_id BIGINT UNSIGNED     NULL,
  entity_type     VARCHAR(64)         NOT NULL,
  entity_id       VARCHAR(100)        NOT NULL,
  operation       VARCHAR(64)         NOT NULL,
  status          ENUM('pending','processing','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
  attempt_count   INT UNSIGNED        NOT NULL DEFAULT 0,
  max_attempts    INT UNSIGNED        NOT NULL DEFAULT 3,
  last_error      TEXT                NULL,
  payload         JSON                NULL,
  scheduled_at    DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at    DATETIME            NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_retry_queue_uuid (uuid),
  KEY idx_retry_queue_org (organization_id),
  KEY idx_retry_queue_status (status),
  KEY idx_retry_queue_entity (entity_type, entity_id),
  KEY idx_retry_queue_scheduled (scheduled_at),
  CONSTRAINT fk_retry_queue_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS background_jobs (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  organization_id BIGINT UNSIGNED     NULL,
  job_type        VARCHAR(64)         NOT NULL,
  status          ENUM('queued','running','completed','failed','cancelled') NOT NULL DEFAULT 'queued',
  payload         JSON                NULL,
  result          JSON                NULL,
  error_message   TEXT                NULL,
  started_at      DATETIME            NULL,
  completed_at    DATETIME            NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_background_jobs_uuid (uuid),
  KEY idx_background_jobs_org (organization_id),
  KEY idx_background_jobs_type (job_type),
  KEY idx_background_jobs_status (status),
  KEY idx_background_jobs_created (created_at),
  CONSTRAINT fk_background_jobs_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
