-- =============================================================================
-- 071_enterprise_production_readiness.sql
-- Report center extensions, saved filters, platform config, feature flag routes,
-- background job schedules, export history indexes, search performance
-- =============================================================================

CREATE TABLE IF NOT EXISTS report_saved_filters (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  user_id         BIGINT UNSIGNED     NOT NULL,
  organization_id BIGINT UNSIGNED     NOT NULL,
  report_type     VARCHAR(50)         NOT NULL,
  filter_name     VARCHAR(100)        NOT NULL,
  filters         JSON                NOT NULL,
  is_default      TINYINT(1)          NOT NULL DEFAULT 0,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_rsf_uuid (uuid),
  KEY idx_rsf_user_org (user_id, organization_id),
  KEY idx_rsf_report_type (report_type),
  CONSTRAINT fk_rsf_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_rsf_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS report_center_catalog (
  id              INT UNSIGNED        NOT NULL AUTO_INCREMENT,
  code            VARCHAR(50)         NOT NULL,
  name            VARCHAR(150)        NOT NULL,
  category        VARCHAR(50)         NOT NULL,
  description     TEXT                NULL,
  source_module   VARCHAR(50)         NOT NULL,
  export_formats  VARCHAR(30)         NOT NULL DEFAULT 'csv,xlsx,pdf',
  is_active       TINYINT(1)          NOT NULL DEFAULT 1,
  display_order   SMALLINT UNSIGNED   NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uk_rcc_code (code),
  KEY idx_rcc_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS platform_config (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  config_key      VARCHAR(80)         NOT NULL,
  config_group    VARCHAR(50)         NOT NULL,
  config_value    JSON                NOT NULL,
  organization_id BIGINT UNSIGNED     NULL,
  description     TEXT                NULL,
  updated_by      BIGINT UNSIGNED     NULL,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_platform_config_key (config_key, organization_id),
  KEY idx_platform_config_group (config_group),
  CONSTRAINT fk_pc_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pc_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS feature_flag_api_routes (
  id              INT UNSIGNED        NOT NULL AUTO_INCREMENT,
  feature_flag_id BIGINT UNSIGNED    NOT NULL,
  route_pattern   VARCHAR(200)        NOT NULL,
  http_method     VARCHAR(10)         NOT NULL DEFAULT '*',
  PRIMARY KEY (id),
  KEY idx_ffar_flag (feature_flag_id),
  CONSTRAINT fk_ffar_flag FOREIGN KEY (feature_flag_id) REFERENCES feature_flags (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS background_job_schedules (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  job_type        ENUM('settlement_processing','reminder','scheduled_report','retry','custom') NOT NULL,
  cron_expression VARCHAR(50)         NOT NULL,
  payload         JSON                NULL,
  organization_id BIGINT UNSIGNED     NULL,
  is_active       TINYINT(1)          NOT NULL DEFAULT 1,
  last_run_at     DATETIME            NULL,
  next_run_at     DATETIME            NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_bjs_uuid (uuid),
  KEY idx_bjs_type_active (job_type, is_active),
  CONSTRAINT fk_bjs_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE report_exports
  ADD COLUMN report_type VARCHAR(50) NULL AFTER report_id,
  ADD KEY idx_report_exports_type (report_type);

-- Search performance indexes
ALTER TABLE merchants ADD KEY idx_merchants_search (display_name, merchant_code);
ALTER TABLE merchant_outlets ADD KEY idx_outlets_search (outlet_name, outlet_code);
ALTER TABLE payment_devices ADD KEY idx_devices_search (device_ref, serial_number);
ALTER TABLE merchant_onboarding_applications ADD KEY idx_moa_search (application_ref);
