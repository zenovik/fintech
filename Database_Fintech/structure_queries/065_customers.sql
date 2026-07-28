-- =============================================================================
-- 065_customers.sql
-- Customer master data and related entities
-- =============================================================================

CREATE TABLE IF NOT EXISTS customers (
  id                    BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                  CHAR(36)            NOT NULL,
  customer_code         VARCHAR(30)         NOT NULL,
  organization_id       BIGINT UNSIGNED     NOT NULL,
  primary_merchant_id   BIGINT UNSIGNED     NULL,
  customer_type         ENUM('individual', 'business') NOT NULL DEFAULT 'individual',
  first_name            VARCHAR(100)        NOT NULL,
  last_name             VARCHAR(100)        NULL,
  display_name          VARCHAR(255)        NOT NULL,
  email                 VARCHAR(255)        NULL,
  phone                 VARCHAR(30)         NULL,
  company_name          VARCHAR(255)        NULL,
  status                ENUM('active', 'inactive', 'blocked', 'pending') NOT NULL DEFAULT 'active',
  kyc_status            ENUM('verified', 'pending', 'rejected', 'not_required') NOT NULL DEFAULT 'pending',
  risk_level            ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'low',
  region_id             TINYINT UNSIGNED    NULL,
  total_spent           DECIMAL(18, 2)      NOT NULL DEFAULT 0.00,
  transaction_count     INT UNSIGNED        NOT NULL DEFAULT 0,
  last_transaction_at   DATETIME            NULL,
  notes                 TEXT                NULL,
  created_by            BIGINT UNSIGNED     NULL,
  updated_by            BIGINT UNSIGNED     NULL,
  created_at            DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at            DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_customers_uuid (uuid),
  UNIQUE KEY uk_customers_code (customer_code),
  KEY idx_customers_organization (organization_id),
  KEY idx_customers_primary_merchant (primary_merchant_id),
  KEY idx_customers_status (status),
  KEY idx_customers_kyc_status (kyc_status),
  KEY idx_customers_risk_level (risk_level),
  KEY idx_customers_email (email),
  KEY idx_customers_display_name (display_name),
  KEY idx_customers_deleted_at (deleted_at),
  KEY idx_customers_last_transaction (last_transaction_at),
  CONSTRAINT fk_customers_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_customers_primary_merchant
    FOREIGN KEY (primary_merchant_id) REFERENCES merchants (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_customers_region
    FOREIGN KEY (region_id) REFERENCES regions (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_customers_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_customers_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_addresses (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  customer_id     BIGINT UNSIGNED     NOT NULL,
  address_type    ENUM('billing', 'shipping', 'other') NOT NULL DEFAULT 'billing',
  line1           VARCHAR(255)        NOT NULL,
  line2           VARCHAR(255)        NULL,
  city            VARCHAR(100)        NOT NULL,
  state_province  VARCHAR(100)        NULL,
  postal_code     VARCHAR(20)         NULL,
  country_code    CHAR(2)             NOT NULL DEFAULT 'US',
  is_primary      TINYINT(1)          NOT NULL DEFAULT 0,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_customer_addresses_uuid (uuid),
  KEY idx_customer_addresses_customer (customer_id),
  CONSTRAINT fk_customer_addresses_customer
    FOREIGN KEY (customer_id) REFERENCES customers (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_merchants (
  id                    BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  customer_id           BIGINT UNSIGNED     NOT NULL,
  merchant_id           BIGINT UNSIGNED     NOT NULL,
  first_transaction_at  DATETIME            NULL,
  last_transaction_at   DATETIME            NULL,
  transaction_count     INT UNSIGNED        NOT NULL DEFAULT 0,
  total_spent           DECIMAL(18, 2)      NOT NULL DEFAULT 0.00,
  created_at            DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_customer_merchants_pair (customer_id, merchant_id),
  KEY idx_customer_merchants_merchant (merchant_id),
  CONSTRAINT fk_customer_merchants_customer
    FOREIGN KEY (customer_id) REFERENCES customers (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_customer_merchants_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
