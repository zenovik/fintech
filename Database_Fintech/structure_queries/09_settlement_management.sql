-- =============================================================================
-- 09_settlement_management.sql
-- Settlement extended schema and related entities
-- =============================================================================

-- Extended settlements (replaces basic definition if re-run)
DROP TABLE IF EXISTS settlement_notes;
DROP TABLE IF EXISTS settlement_exports;
DROP TABLE IF EXISTS settlement_status_history;
DROP TABLE IF EXISTS settlement_bank_transfers;
DROP TABLE IF EXISTS settlement_fees;
DROP TABLE IF EXISTS settlement_reversals;
DROP TABLE IF EXISTS settlement_adjustments;
DROP TABLE IF EXISTS settlement_transactions;
DROP TABLE IF EXISTS settlements;
DROP TABLE IF EXISTS settlement_batches;

CREATE TABLE IF NOT EXISTS settlement_batches (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  batch_ref       VARCHAR(30)         NOT NULL,
  status          ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending',
  total_amount    DECIMAL(18, 2)      NOT NULL DEFAULT 0.00,
  settlement_count INT UNSIGNED       NOT NULL DEFAULT 0,
  currency        CHAR(3)             NOT NULL DEFAULT 'USD',
  scheduled_at    DATETIME            NULL,
  processed_at    DATETIME            NULL,
  created_by      BIGINT UNSIGNED     NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_settlement_batches_uuid (uuid),
  UNIQUE KEY uk_settlement_batches_ref (batch_ref),
  KEY idx_settlement_batches_status (status),
  KEY idx_settlement_batches_processed_at (processed_at),
  CONSTRAINT fk_settlement_batches_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settlements (
  id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                CHAR(36)            NOT NULL,
  settlement_ref      VARCHAR(30)         NOT NULL,
  merchant_id         BIGINT UNSIGNED     NOT NULL,
  batch_id            BIGINT UNSIGNED     NULL,
  gross_amount        DECIMAL(18, 2)      NOT NULL,
  fee_amount          DECIMAL(18, 2)      NOT NULL DEFAULT 0.00,
  adjustment_amount   DECIMAL(18, 2)      NOT NULL DEFAULT 0.00,
  amount              DECIMAL(18, 2)      NOT NULL,
  currency            CHAR(3)             NOT NULL DEFAULT 'USD',
  status              ENUM('pending', 'processing', 'processed', 'failed', 'reversed') NOT NULL DEFAULT 'pending',
  settlement_cycle    ENUM('daily', 'weekly', 'monthly') NULL,
  scheduled_at        DATETIME            NULL,
  processed_at        DATETIME            NULL,
  bank_transfer_ref   VARCHAR(50)         NULL,
  created_by          BIGINT UNSIGNED     NULL,
  updated_by          BIGINT UNSIGNED     NULL,
  created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at          DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_settlements_uuid (uuid),
  UNIQUE KEY uk_settlements_ref (settlement_ref),
  KEY idx_settlements_merchant (merchant_id),
  KEY idx_settlements_batch (batch_id),
  KEY idx_settlements_status (status),
  KEY idx_settlements_processed_at (processed_at),
  KEY idx_settlements_deleted_at (deleted_at),
  CONSTRAINT fk_settlements_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_settlements_batch
    FOREIGN KEY (batch_id) REFERENCES settlement_batches (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_settlements_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_settlements_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settlement_transactions (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  settlement_id   BIGINT UNSIGNED     NOT NULL,
  transaction_id  BIGINT UNSIGNED     NOT NULL,
  amount          DECIMAL(18, 2)      NOT NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_settlement_transactions (settlement_id, transaction_id),
  KEY idx_settlement_transactions_transaction (transaction_id),
  CONSTRAINT fk_settlement_transactions_settlement
    FOREIGN KEY (settlement_id) REFERENCES settlements (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_settlement_transactions_transaction
    FOREIGN KEY (transaction_id) REFERENCES transactions (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settlement_adjustments (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  settlement_id   BIGINT UNSIGNED     NOT NULL,
  adjustment_type ENUM('credit', 'debit', 'chargeback', 'fee_correction') NOT NULL,
  amount          DECIMAL(18, 2)      NOT NULL,
  currency        CHAR(3)             NOT NULL DEFAULT 'USD',
  reason          VARCHAR(500)        NULL,
  created_by      BIGINT UNSIGNED     NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at      DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_settlement_adjustments_uuid (uuid),
  KEY idx_settlement_adjustments_settlement (settlement_id),
  CONSTRAINT fk_settlement_adjustments_settlement
    FOREIGN KEY (settlement_id) REFERENCES settlements (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_settlement_adjustments_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settlement_reversals (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  settlement_id   BIGINT UNSIGNED     NOT NULL,
  reversal_ref    VARCHAR(30)         NOT NULL,
  amount          DECIMAL(18, 2)      NOT NULL,
  currency        CHAR(3)             NOT NULL DEFAULT 'USD',
  reason          VARCHAR(500)        NOT NULL,
  status          ENUM('pending', 'processed', 'failed') NOT NULL DEFAULT 'pending',
  processed_at    DATETIME            NULL,
  created_by      BIGINT UNSIGNED     NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_settlement_reversals_uuid (uuid),
  UNIQUE KEY uk_settlement_reversals_ref (reversal_ref),
  KEY idx_settlement_reversals_settlement (settlement_id),
  CONSTRAINT fk_settlement_reversals_settlement
    FOREIGN KEY (settlement_id) REFERENCES settlements (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_settlement_reversals_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settlement_fees (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  settlement_id   BIGINT UNSIGNED     NOT NULL,
  fee_type        VARCHAR(50)         NOT NULL,
  amount          DECIMAL(18, 2)      NOT NULL,
  currency        CHAR(3)             NOT NULL DEFAULT 'USD',
  description     VARCHAR(255)        NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_settlement_fees_settlement (settlement_id),
  CONSTRAINT fk_settlement_fees_settlement
    FOREIGN KEY (settlement_id) REFERENCES settlements (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settlement_bank_transfers (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  settlement_id   BIGINT UNSIGNED     NOT NULL,
  bank_name       VARCHAR(255)        NULL,
  account_masked  VARCHAR(30)         NOT NULL,
  transfer_ref    VARCHAR(50)         NULL,
  amount          DECIMAL(18, 2)      NOT NULL,
  currency        CHAR(3)             NOT NULL DEFAULT 'USD',
  status          ENUM('pending', 'sent', 'confirmed', 'failed') NOT NULL DEFAULT 'pending',
  sent_at         DATETIME            NULL,
  confirmed_at    DATETIME            NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_settlement_bank_transfers_uuid (uuid),
  KEY idx_settlement_bank_transfers_settlement (settlement_id),
  CONSTRAINT fk_settlement_bank_transfers_settlement
    FOREIGN KEY (settlement_id) REFERENCES settlements (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settlement_status_history (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  settlement_id   BIGINT UNSIGNED     NOT NULL,
  from_status     VARCHAR(20)         NULL,
  to_status       VARCHAR(20)         NOT NULL,
  reason          VARCHAR(500)        NULL,
  changed_by      BIGINT UNSIGNED     NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_settlement_status_history_settlement (settlement_id),
  CONSTRAINT fk_settlement_status_history_settlement
    FOREIGN KEY (settlement_id) REFERENCES settlements (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_settlement_status_history_changed_by
    FOREIGN KEY (changed_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settlement_exports (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  user_id         BIGINT UNSIGNED     NOT NULL,
  format          ENUM('csv', 'xlsx', 'pdf') NOT NULL DEFAULT 'csv',
  filter_params   JSON                NULL,
  status          ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending',
  row_count       INT UNSIGNED        NULL,
  completed_at    DATETIME            NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_settlement_exports_uuid (uuid),
  KEY idx_settlement_exports_user (user_id),
  CONSTRAINT fk_settlement_exports_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settlement_notes (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  settlement_id   BIGINT UNSIGNED     NOT NULL,
  author_user_id  BIGINT UNSIGNED     NULL,
  note_text       TEXT                NOT NULL,
  is_internal     TINYINT(1)          NOT NULL DEFAULT 1,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_settlement_notes_uuid (uuid),
  KEY idx_settlement_notes_settlement (settlement_id),
  CONSTRAINT fk_settlement_notes_settlement
    FOREIGN KEY (settlement_id) REFERENCES settlements (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_settlement_notes_author
    FOREIGN KEY (author_user_id) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
