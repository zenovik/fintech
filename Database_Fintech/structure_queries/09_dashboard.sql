-- =============================================================================
-- 09_dashboard.sql
-- Dashboard analytics, activities, fraud alerts, preferences, exports
-- =============================================================================

CREATE TABLE IF NOT EXISTS fraud_alerts (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  title           VARCHAR(255)        NOT NULL,
  message         TEXT                NOT NULL,
  merchant_id     BIGINT UNSIGNED     NULL,
  severity_id     TINYINT UNSIGNED    NOT NULL,
  region_code     VARCHAR(10)         NULL,
  source          VARCHAR(50)         NOT NULL,
  is_active       TINYINT(1)          NOT NULL DEFAULT 1,
  is_dismissed    TINYINT(1)          NOT NULL DEFAULT 0,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at      DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_fraud_alerts_uuid (uuid),
  KEY idx_fraud_alerts_active_created (is_active, is_dismissed, created_at DESC),
  CONSTRAINT fk_fraud_alerts_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_fraud_alerts_severity
    FOREIGN KEY (severity_id) REFERENCES fraud_alert_severities (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity_events (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  event_type_id   TINYINT UNSIGNED    NOT NULL,
  title           VARCHAR(255)        NOT NULL,
  description     TEXT                NOT NULL,
  actor_user_id   BIGINT UNSIGNED     NULL,
  merchant_id     BIGINT UNSIGNED     NULL,
  settlement_id   BIGINT UNSIGNED     NULL,
  metadata        JSON                NULL,
  occurred_at     DATETIME            NOT NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_activity_events_uuid (uuid),
  KEY idx_activity_events_occurred (occurred_at DESC),
  CONSTRAINT fk_activity_events_type
    FOREIGN KEY (event_type_id) REFERENCES activity_event_types (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_activity_events_actor
    FOREIGN KEY (actor_user_id) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_activity_events_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_activity_events_settlement
    FOREIGN KEY (settlement_id) REFERENCES settlements (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dashboard_kpi_snapshots (
  id                      BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  snapshot_date           DATE                NOT NULL,
  period_type             ENUM('daily', 'weekly', 'monthly') NOT NULL,
  total_revenue           DECIMAL(20, 2)      NOT NULL DEFAULT 0,
  total_transactions      BIGINT UNSIGNED     NOT NULL DEFAULT 0,
  total_merchants         INT UNSIGNED        NOT NULL DEFAULT 0,
  success_rate            DECIMAL(5, 2)       NOT NULL DEFAULT 0,
  revenue_change_pct      DECIMAL(6, 2)       NULL,
  transactions_change_pct DECIMAL(6, 2)       NULL,
  merchants_change_pct    DECIMAL(6, 2)       NULL,
  currency_base           CHAR(3)             NOT NULL DEFAULT 'USD',
  computed_at             DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_dashboard_kpi_snapshots (snapshot_date, period_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS revenue_time_series (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  period_date     DATE                NOT NULL,
  period_type     ENUM('daily', 'weekly', 'monthly') NOT NULL,
  granularity     ENUM('day', 'week', 'month') NOT NULL,
  actual_revenue  DECIMAL(20, 2)      NOT NULL DEFAULT 0,
  forecast_revenue DECIMAL(20, 2)     NOT NULL DEFAULT 0,
  currency        CHAR(3)             NOT NULL DEFAULT 'USD',
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_revenue_time_series (period_date, period_type, granularity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_method_distribution (
  id                      BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  snapshot_date           DATE                NOT NULL,
  period_type             ENUM('daily', 'weekly', 'monthly') NOT NULL,
  payment_method_type_id  TINYINT UNSIGNED    NOT NULL,
  transaction_count       INT UNSIGNED        NOT NULL DEFAULT 0,
  total_amount            DECIMAL(20, 2)      NOT NULL DEFAULT 0,
  percentage              DECIMAL(5, 2)       NOT NULL DEFAULT 0,
  created_at              DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_payment_method_distribution (snapshot_date, period_type, payment_method_type_id),
  CONSTRAINT fk_pmd_payment_method
    FOREIGN KEY (payment_method_type_id) REFERENCES payment_method_types (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS regional_distribution (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  snapshot_date   DATE                NOT NULL,
  period_type     ENUM('daily', 'weekly', 'monthly') NOT NULL,
  region_id       TINYINT UNSIGNED    NOT NULL,
  total_volume    DECIMAL(20, 2)      NOT NULL DEFAULT 0,
  percentage      DECIMAL(5, 2)       NOT NULL DEFAULT 0,
  progress_pct    DECIMAL(5, 2)       NOT NULL DEFAULT 0,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_regional_distribution (snapshot_date, period_type, region_id),
  CONSTRAINT fk_regional_distribution_region
    FOREIGN KEY (region_id) REFERENCES regions (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_dashboard_preferences (
  user_id                 BIGINT UNSIGNED     NOT NULL,
  default_date_range      ENUM('daily', 'weekly', 'monthly', 'custom') NOT NULL DEFAULT 'monthly',
  custom_date_from        DATE                NULL,
  custom_date_to          DATE                NULL,
  high_value_threshold    DECIMAL(18, 2)      NOT NULL DEFAULT 50000.00,
  table_page_size         TINYINT UNSIGNED    NOT NULL DEFAULT 10,
  updated_at              DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_user_dashboard_preferences_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dashboard_export_jobs (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  user_id         BIGINT UNSIGNED     NOT NULL,
  format_id       TINYINT UNSIGNED    NOT NULL,
  date_range_params JSON              NOT NULL,
  status          ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending',
  file_url        VARCHAR(500)        NULL,
  error_message   TEXT                NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at    DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_dashboard_export_jobs_uuid (uuid),
  KEY idx_dashboard_export_jobs_user (user_id, created_at DESC),
  CONSTRAINT fk_dashboard_export_jobs_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_dashboard_export_jobs_format
    FOREIGN KEY (format_id) REFERENCES dashboard_export_formats (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
