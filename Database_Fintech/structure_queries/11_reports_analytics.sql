-- =============================================================================
-- 11_reports_analytics.sql
-- Reports & Analytics module schema
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Report categories
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_categories (
  id              INT UNSIGNED        NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  code            VARCHAR(50)         NOT NULL,
  name            VARCHAR(100)        NOT NULL,
  description     TEXT                NULL,
  display_order   TINYINT UNSIGNED    NOT NULL DEFAULT 0,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_report_categories_uuid (uuid),
  UNIQUE KEY uk_report_categories_code (code),
  KEY idx_report_categories_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Report templates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_templates (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  category_id     INT UNSIGNED        NOT NULL,
  code            VARCHAR(50)         NOT NULL,
  name            VARCHAR(150)        NOT NULL,
  description     TEXT                NULL,
  query_type      ENUM('revenue', 'transactions', 'settlements', 'merchants', 'customers', 'custom') NOT NULL,
  config          JSON                NULL,
  is_system       TINYINT(1)          NOT NULL DEFAULT 1,
  created_by      BIGINT UNSIGNED     NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_report_templates_uuid (uuid),
  UNIQUE KEY uk_report_templates_code (code),
  KEY idx_report_templates_category (category_id),
  CONSTRAINT fk_report_templates_category
    FOREIGN KEY (category_id) REFERENCES report_categories (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_report_templates_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Reports (saved / custom report definitions)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  name            VARCHAR(200)        NOT NULL,
  description     TEXT                NULL,
  template_id     BIGINT UNSIGNED     NULL,
  category_id     INT UNSIGNED        NULL,
  status          ENUM('draft', 'active', 'archived') NOT NULL DEFAULT 'active',
  filters         JSON                NULL,
  created_by      BIGINT UNSIGNED     NULL,
  updated_by      BIGINT UNSIGNED     NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_reports_uuid (uuid),
  KEY idx_reports_status (status),
  KEY idx_reports_template (template_id),
  KEY idx_reports_category (category_id),
  KEY idx_reports_created_by (created_by),
  CONSTRAINT fk_reports_template
    FOREIGN KEY (template_id) REFERENCES report_templates (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_reports_category
    FOREIGN KEY (category_id) REFERENCES report_categories (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_reports_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_reports_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Saved reports (user bookmarks)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_reports (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  user_id         BIGINT UNSIGNED     NOT NULL,
  report_id       BIGINT UNSIGNED     NOT NULL,
  name            VARCHAR(200)        NOT NULL,
  filters         JSON                NULL,
  is_favorite     TINYINT(1)          NOT NULL DEFAULT 0,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_saved_reports_uuid (uuid),
  KEY idx_saved_reports_user (user_id),
  KEY idx_saved_reports_report (report_id),
  CONSTRAINT fk_saved_reports_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_saved_reports_report
    FOREIGN KEY (report_id) REFERENCES reports (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Scheduled reports
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  report_id       BIGINT UNSIGNED     NOT NULL,
  user_id         BIGINT UNSIGNED     NOT NULL,
  name            VARCHAR(200)        NOT NULL,
  cron_expression VARCHAR(100)        NOT NULL,
  format          ENUM('csv', 'xlsx', 'pdf') NOT NULL DEFAULT 'csv',
  recipients      JSON                NULL,
  filters         JSON                NULL,
  is_active       TINYINT(1)          NOT NULL DEFAULT 1,
  last_run_at     DATETIME            NULL,
  next_run_at     DATETIME            NULL,
  created_by      BIGINT UNSIGNED     NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_scheduled_reports_uuid (uuid),
  KEY idx_scheduled_reports_user (user_id),
  KEY idx_scheduled_reports_report (report_id),
  KEY idx_scheduled_reports_next_run (next_run_at, is_active),
  CONSTRAINT fk_scheduled_reports_report
    FOREIGN KEY (report_id) REFERENCES reports (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_scheduled_reports_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_scheduled_reports_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Report exports
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_exports (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  user_id         BIGINT UNSIGNED     NOT NULL,
  report_id       BIGINT UNSIGNED     NULL,
  format          ENUM('csv', 'xlsx', 'pdf') NOT NULL DEFAULT 'csv',
  status          ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending',
  file_url        VARCHAR(500)        NULL,
  file_name       VARCHAR(255)        NULL,
  row_count       INT UNSIGNED        NULL,
  filter_params   JSON                NULL,
  error_message   TEXT                NULL,
  completed_at    DATETIME            NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_report_exports_uuid (uuid),
  KEY idx_report_exports_user (user_id, created_at DESC),
  KEY idx_report_exports_status (status),
  CONSTRAINT fk_report_exports_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_report_exports_report
    FOREIGN KEY (report_id) REFERENCES reports (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Report execution logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_execution_logs (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  report_id       BIGINT UNSIGNED     NULL,
  user_id         BIGINT UNSIGNED     NULL,
  execution_type  ENUM('manual', 'scheduled', 'export') NOT NULL DEFAULT 'manual',
  status          ENUM('running', 'completed', 'failed') NOT NULL DEFAULT 'running',
  rows_returned   INT UNSIGNED        NULL,
  duration_ms     INT UNSIGNED        NULL,
  error_message   TEXT                NULL,
  filter_params   JSON                NULL,
  started_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at    DATETIME            NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_report_execution_logs_uuid (uuid),
  KEY idx_report_execution_logs_report (report_id, started_at DESC),
  KEY idx_report_execution_logs_user (user_id, started_at DESC),
  CONSTRAINT fk_report_execution_logs_report
    FOREIGN KEY (report_id) REFERENCES reports (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_report_execution_logs_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Analytics metrics catalog
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analytics_metrics (
  id              INT UNSIGNED        NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  code            VARCHAR(80)         NOT NULL,
  name            VARCHAR(150)        NOT NULL,
  category        VARCHAR(50)         NOT NULL,
  unit            VARCHAR(20)         NULL,
  description     TEXT                NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_analytics_metrics_uuid (uuid),
  UNIQUE KEY uk_analytics_metrics_code (code),
  KEY idx_analytics_metrics_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Analytics snapshots (pre-aggregated time series)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  snapshot_date   DATE                NOT NULL,
  period_type     ENUM('daily', 'weekly', 'monthly') NOT NULL DEFAULT 'daily',
  metric_group    VARCHAR(50)         NOT NULL,
  data            JSON                NOT NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_analytics_snapshots_uuid (uuid),
  UNIQUE KEY uk_analytics_snapshots_date_group (snapshot_date, period_type, metric_group),
  KEY idx_analytics_snapshots_group (metric_group, snapshot_date DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Analytics widgets catalog
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analytics_widgets (
  id              INT UNSIGNED        NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  code            VARCHAR(80)         NOT NULL,
  name            VARCHAR(150)        NOT NULL,
  widget_type     ENUM('chart', 'table', 'kpi', 'donut', 'bar') NOT NULL DEFAULT 'chart',
  config          JSON                NULL,
  metric_codes    JSON                NULL,
  display_order   TINYINT UNSIGNED    NOT NULL DEFAULT 0,
  is_active       TINYINT(1)          NOT NULL DEFAULT 1,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_analytics_widgets_uuid (uuid),
  UNIQUE KEY uk_analytics_widgets_code (code),
  KEY idx_analytics_widgets_active (is_active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Dashboard preferences (reports & analytics)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dashboard_preferences (
  id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  user_id             BIGINT UNSIGNED     NOT NULL,
  default_period      ENUM('daily', 'weekly', 'monthly') NOT NULL DEFAULT 'monthly',
  default_date_from   DATE                NULL,
  default_date_to     DATE                NULL,
  widget_layout       JSON                NULL,
  theme               VARCHAR(30)         NULL DEFAULT 'default',
  created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_dashboard_preferences_user (user_id),
  CONSTRAINT fk_dashboard_preferences_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
