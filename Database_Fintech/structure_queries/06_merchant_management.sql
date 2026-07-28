-- =============================================================================
-- 06_merchant_management.sql
-- Merchant related entities
-- =============================================================================

CREATE TABLE IF NOT EXISTS merchant_tags (
  id              INT UNSIGNED        NOT NULL AUTO_INCREMENT,
  name            VARCHAR(50)         NOT NULL,
  color           VARCHAR(20)         NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_merchant_tags_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS merchant_addresses (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  merchant_id     BIGINT UNSIGNED     NOT NULL,
  address_type    ENUM('registered', 'billing', 'shipping', 'other') NOT NULL DEFAULT 'registered',
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
  UNIQUE KEY uk_merchant_addresses_uuid (uuid),
  KEY idx_merchant_addresses_merchant (merchant_id),
  CONSTRAINT fk_merchant_addresses_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS merchant_contacts (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  merchant_id     BIGINT UNSIGNED     NOT NULL,
  contact_type    ENUM('primary', 'billing', 'support', 'technical') NOT NULL DEFAULT 'primary',
  first_name      VARCHAR(100)        NOT NULL,
  last_name         VARCHAR(100)        NOT NULL,
  email           VARCHAR(255)        NOT NULL,
  phone           VARCHAR(30)         NULL,
  job_title       VARCHAR(100)        NULL,
  is_primary      TINYINT(1)          NOT NULL DEFAULT 0,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_merchant_contacts_uuid (uuid),
  KEY idx_merchant_contacts_merchant (merchant_id),
  KEY idx_merchant_contacts_email (email),
  CONSTRAINT fk_merchant_contacts_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS merchant_documents (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  merchant_id     BIGINT UNSIGNED     NOT NULL,
  document_type   VARCHAR(50)         NOT NULL,
  file_name       VARCHAR(255)        NOT NULL,
  file_url        VARCHAR(500)        NULL,
  status          ENUM('approved', 'pending', 'rejected', 'missing') NOT NULL DEFAULT 'pending',
  uploaded_by     BIGINT UNSIGNED     NULL,
  reviewed_at     DATETIME            NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_merchant_documents_uuid (uuid),
  KEY idx_merchant_documents_merchant (merchant_id),
  KEY idx_merchant_documents_status (status),
  CONSTRAINT fk_merchant_documents_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_merchant_documents_uploaded_by
    FOREIGN KEY (uploaded_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS merchant_bank_accounts (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  merchant_id     BIGINT UNSIGNED     NOT NULL,
  account_holder  VARCHAR(255)        NOT NULL,
  bank_name       VARCHAR(255)        NULL,
  account_number_masked VARCHAR(30)   NOT NULL,
  iban            VARCHAR(34)         NULL,
  swift_bic       VARCHAR(11)         NULL,
  currency        CHAR(3)             NOT NULL DEFAULT 'USD',
  is_primary      TINYINT(1)          NOT NULL DEFAULT 1,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_merchant_bank_accounts_uuid (uuid),
  KEY idx_merchant_bank_accounts_merchant (merchant_id),
  CONSTRAINT fk_merchant_bank_accounts_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS merchant_settlement_accounts (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  merchant_id     BIGINT UNSIGNED     NOT NULL,
  bank_account_id BIGINT UNSIGNED     NULL,
  settlement_cycle ENUM('daily', 'weekly', 'monthly') NOT NULL DEFAULT 'daily',
  currency        CHAR(3)             NOT NULL DEFAULT 'USD',
  is_active       TINYINT(1)          NOT NULL DEFAULT 1,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_merchant_settlement_accounts_uuid (uuid),
  KEY idx_merchant_settlement_accounts_merchant (merchant_id),
  CONSTRAINT fk_merchant_settlement_accounts_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_merchant_settlement_accounts_bank
    FOREIGN KEY (bank_account_id) REFERENCES merchant_bank_accounts (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS merchant_payment_methods (
  id                      BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  merchant_id             BIGINT UNSIGNED     NOT NULL,
  payment_method_type_id  TINYINT UNSIGNED    NOT NULL,
  is_enabled              TINYINT(1)          NOT NULL DEFAULT 1,
  created_at              DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_merchant_payment_methods (merchant_id, payment_method_type_id),
  CONSTRAINT fk_merchant_payment_methods_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_merchant_payment_methods_type
    FOREIGN KEY (payment_method_type_id) REFERENCES payment_method_types (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS merchant_api_credentials (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  merchant_id     BIGINT UNSIGNED     NOT NULL,
  key_name        VARCHAR(100)        NOT NULL,
  api_key_prefix  VARCHAR(20)         NOT NULL,
  api_key_hash    VARCHAR(255)        NOT NULL,
  environment     ENUM('sandbox', 'production') NOT NULL DEFAULT 'sandbox',
  is_active       TINYINT(1)          NOT NULL DEFAULT 1,
  last_used_at    DATETIME            NULL,
  expires_at      DATETIME            NULL,
  created_by      BIGINT UNSIGNED     NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_merchant_api_credentials_uuid (uuid),
  KEY idx_merchant_api_credentials_merchant (merchant_id),
  CONSTRAINT fk_merchant_api_credentials_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_merchant_api_credentials_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS merchant_webhooks (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  merchant_id     BIGINT UNSIGNED     NOT NULL,
  url             VARCHAR(500)        NOT NULL,
  event_types     JSON                NOT NULL,
  secret_hash     VARCHAR(255)        NULL,
  is_active       TINYINT(1)          NOT NULL DEFAULT 1,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_merchant_webhooks_uuid (uuid),
  KEY idx_merchant_webhooks_merchant (merchant_id),
  CONSTRAINT fk_merchant_webhooks_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS merchant_notes (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  merchant_id     BIGINT UNSIGNED     NOT NULL,
  author_user_id  BIGINT UNSIGNED     NULL,
  note_text       TEXT                NOT NULL,
  is_internal     TINYINT(1)          NOT NULL DEFAULT 1,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_merchant_notes_uuid (uuid),
  KEY idx_merchant_notes_merchant (merchant_id),
  CONSTRAINT fk_merchant_notes_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_merchant_notes_author
    FOREIGN KEY (author_user_id) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS merchant_tag_assignments (
  merchant_id     BIGINT UNSIGNED     NOT NULL,
  tag_id          INT UNSIGNED        NOT NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (merchant_id, tag_id),
  CONSTRAINT fk_merchant_tag_assignments_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_merchant_tag_assignments_tag
    FOREIGN KEY (tag_id) REFERENCES merchant_tags (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
