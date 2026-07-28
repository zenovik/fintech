-- =============================================================================
-- 07_transactions.sql
-- Transactions and settlements
-- =============================================================================

CREATE TABLE IF NOT EXISTS transactions (
  id                      BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                    CHAR(36)            NOT NULL,
  transaction_ref         VARCHAR(30)         NOT NULL,
  merchant_id             BIGINT UNSIGNED     NOT NULL,
  customer_id             BIGINT UNSIGNED     NULL,
  customer_name           VARCHAR(255)        NULL,
  customer_email          VARCHAR(255)        NULL,
  description             TEXT                NULL,
  amount                  DECIMAL(18, 2)      NOT NULL,
  fee_amount              DECIMAL(18, 2)      NOT NULL DEFAULT 0.00,
  net_amount              DECIMAL(18, 2)      NULL,
  currency                CHAR(3)             NOT NULL DEFAULT 'USD',
  payment_method_type_id  TINYINT UNSIGNED    NOT NULL,
  payment_method_detail   VARCHAR(100)        NOT NULL,
  status_id               TINYINT UNSIGNED    NOT NULL,
  region_id               TINYINT UNSIGNED    NOT NULL,
  is_high_value           TINYINT(1)          NOT NULL DEFAULT 0,
  processed_at            DATETIME            NOT NULL,
  settled_at              DATETIME            NULL,
  created_by              BIGINT UNSIGNED     NULL,
  updated_by              BIGINT UNSIGNED     NULL,
  created_at              DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at              DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_transactions_uuid (uuid),
  UNIQUE KEY uk_transactions_ref (transaction_ref),
  KEY idx_transactions_merchant_processed (merchant_id, processed_at),
  KEY idx_transactions_status_processed (status_id, processed_at),
  KEY idx_transactions_high_value_processed (is_high_value, processed_at DESC),
  KEY idx_transactions_region_processed (region_id, processed_at),
  KEY idx_transactions_amount (amount),
  KEY idx_transactions_deleted_at (deleted_at),
  KEY idx_transactions_customer_email (customer_email),
  KEY idx_transactions_customer_id (customer_id),
  CONSTRAINT fk_transactions_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_transactions_payment_method
    FOREIGN KEY (payment_method_type_id) REFERENCES payment_method_types (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_transactions_status
    FOREIGN KEY (status_id) REFERENCES transaction_statuses (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_transactions_region
    FOREIGN KEY (region_id) REFERENCES regions (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_transactions_customer
    FOREIGN KEY (customer_id) REFERENCES customers (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_transactions_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_transactions_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
