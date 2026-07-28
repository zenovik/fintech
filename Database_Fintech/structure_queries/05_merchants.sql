-- =============================================================================
-- 05_merchants.sql
-- Merchant master data (extended)
-- =============================================================================

CREATE TABLE IF NOT EXISTS merchants (
  id                    BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                  CHAR(36)            NOT NULL,
  merchant_code         VARCHAR(30)         NOT NULL,
  legal_name            VARCHAR(255)        NOT NULL,
  display_name          VARCHAR(255)        NOT NULL,
  logo_initials         VARCHAR(4)          NULL,
  logo_color            VARCHAR(20)         NULL,
  business_type         ENUM('saas', 'retail', 'services', 'logistics', 'fintech', 'healthcare', 'other') NULL,
  business_category     VARCHAR(100)        NULL,
  entity_type           VARCHAR(100)        NULL,
  registration_number   VARCHAR(100)        NULL,
  website               VARCHAR(255)        NULL,
  monthly_tpv_estimate  DECIMAL(18, 2)      NULL,
  kyc_status            ENUM('verified', 'pending', 'rejected') NOT NULL DEFAULT 'pending',
  risk_level            ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'low',
  status                ENUM('active', 'pending', 'suspended', 'inactive') NOT NULL DEFAULT 'pending',
  region_id             TINYINT UNSIGNED    NOT NULL,
  daily_volume          DECIMAL(18, 2)      NOT NULL DEFAULT 0.00,
  wallet_balance        DECIMAL(18, 2)      NOT NULL DEFAULT 0.00,
  onboarded_at          DATETIME            NULL,
  created_by            BIGINT UNSIGNED     NULL,
  updated_by            BIGINT UNSIGNED     NULL,
  created_at            DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at            DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_merchants_uuid (uuid),
  UNIQUE KEY uk_merchants_code (merchant_code),
  KEY idx_merchants_status (status),
  KEY idx_merchants_kyc_status (kyc_status),
  KEY idx_merchants_risk_level (risk_level),
  KEY idx_merchants_region_id (region_id),
  KEY idx_merchants_onboarded_at (onboarded_at),
  KEY idx_merchants_deleted_at (deleted_at),
  KEY idx_merchants_display_name (display_name),
  KEY idx_merchants_created_at (created_at),
  CONSTRAINT fk_merchants_region
    FOREIGN KEY (region_id) REFERENCES regions (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_merchants_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_merchants_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
