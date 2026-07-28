-- =============================================================================
-- 11_payment_links.sql
-- Payment link management
-- =============================================================================

CREATE TABLE IF NOT EXISTS payment_links (
  id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                CHAR(36)            NOT NULL,
  organization_id     BIGINT UNSIGNED     NOT NULL,
  merchant_id         BIGINT UNSIGNED     NOT NULL,
  customer_id         BIGINT UNSIGNED     NULL,
  link_ref            VARCHAR(30)         NOT NULL,
  title               VARCHAR(255)        NOT NULL,
  description         TEXT                NULL,
  amount              DECIMAL(18, 2)      NULL,
  currency            CHAR(3)             NOT NULL DEFAULT 'USD',
  allow_custom_amount TINYINT(1)          NOT NULL DEFAULT 0,
  expires_at          DATETIME            NULL,
  max_usage           INT UNSIGNED        NULL,
  current_usage       INT UNSIGNED        NOT NULL DEFAULT 0,
  status              ENUM('active', 'disabled', 'expired') NOT NULL DEFAULT 'active',
  public_token        VARCHAR(64)         NOT NULL,
  redirect_url        VARCHAR(500)        NULL,
  success_url         VARCHAR(500)        NULL,
  cancel_url          VARCHAR(500)        NULL,
  created_by          BIGINT UNSIGNED     NULL,
  updated_by          BIGINT UNSIGNED     NULL,
  created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at          DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_payment_links_uuid (uuid),
  UNIQUE KEY uk_payment_links_ref (link_ref),
  UNIQUE KEY uk_payment_links_token (public_token),
  KEY idx_payment_links_org (organization_id),
  KEY idx_payment_links_merchant (merchant_id),
  KEY idx_payment_links_customer (customer_id),
  KEY idx_payment_links_status (status),
  KEY idx_payment_links_expires (expires_at),
  KEY idx_payment_links_deleted (deleted_at),
  CONSTRAINT fk_payment_links_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_payment_links_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_payment_links_customer
    FOREIGN KEY (customer_id) REFERENCES customers (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_payment_links_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_payment_links_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_link_transactions (
  id                BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  payment_link_id   BIGINT UNSIGNED     NOT NULL,
  transaction_id    BIGINT UNSIGNED     NOT NULL,
  paid_amount       DECIMAL(18, 2)      NOT NULL,
  created_at        DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_payment_link_tx (payment_link_id, transaction_id),
  KEY idx_payment_link_transactions_tx (transaction_id),
  CONSTRAINT fk_plt_payment_link
    FOREIGN KEY (payment_link_id) REFERENCES payment_links (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_plt_transaction
    FOREIGN KEY (transaction_id) REFERENCES transactions (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
