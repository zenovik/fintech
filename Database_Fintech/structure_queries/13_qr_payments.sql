-- =============================================================================
-- 13_qr_payments.sql
-- QR payment codes
-- =============================================================================

CREATE TABLE IF NOT EXISTS qr_codes (
  id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                CHAR(36)            NOT NULL,
  organization_id     BIGINT UNSIGNED     NOT NULL,
  merchant_id         BIGINT UNSIGNED     NOT NULL,
  customer_id         BIGINT UNSIGNED     NULL,
  qr_ref              VARCHAR(30)         NOT NULL,
  qr_type             ENUM('static','dynamic','merchant','customer') NOT NULL DEFAULT 'static',
  title               VARCHAR(255)        NOT NULL,
  description         TEXT                NULL,
  amount              DECIMAL(18, 2)      NULL,
  currency            CHAR(3)             NOT NULL DEFAULT 'USD',
  allow_custom_amount TINYINT(1)          NOT NULL DEFAULT 0,
  expires_at          DATETIME            NULL,
  scan_count          INT UNSIGNED        NOT NULL DEFAULT 0,
  status              ENUM('active','disabled') NOT NULL DEFAULT 'active',
  public_token        VARCHAR(64)         NOT NULL,
  created_by          BIGINT UNSIGNED     NULL,
  updated_by          BIGINT UNSIGNED     NULL,
  created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at          DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_qr_codes_uuid (uuid),
  UNIQUE KEY uk_qr_codes_ref (qr_ref),
  UNIQUE KEY uk_qr_codes_token (public_token),
  KEY idx_qr_codes_org (organization_id),
  KEY idx_qr_codes_merchant (merchant_id),
  KEY idx_qr_codes_customer (customer_id),
  KEY idx_qr_codes_type (qr_type),
  KEY idx_qr_codes_status (status),
  KEY idx_qr_codes_deleted (deleted_at),
  CONSTRAINT fk_qr_codes_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_qr_codes_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_qr_codes_customer
    FOREIGN KEY (customer_id) REFERENCES customers (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_qr_codes_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_qr_codes_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS qr_transactions (
  id                BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  qr_code_id        BIGINT UNSIGNED     NOT NULL,
  transaction_id    BIGINT UNSIGNED     NOT NULL,
  paid_amount       DECIMAL(18, 2)      NOT NULL,
  created_at        DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_qr_tx (qr_code_id, transaction_id),
  KEY idx_qr_transactions_tx (transaction_id),
  CONSTRAINT fk_qr_tx_qr_code
    FOREIGN KEY (qr_code_id) REFERENCES qr_codes (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_qr_tx_transaction
    FOREIGN KEY (transaction_id) REFERENCES transactions (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
