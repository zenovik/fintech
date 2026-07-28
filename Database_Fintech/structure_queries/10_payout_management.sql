-- =============================================================================
-- 10_payout_management.sql
-- Payout execution layer (links to settlements + merchant bank accounts)
-- =============================================================================

CREATE TABLE IF NOT EXISTS payout_batches (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  batch_ref       VARCHAR(30)         NOT NULL,
  status          ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending',
  total_amount    DECIMAL(18, 2)      NOT NULL DEFAULT 0.00,
  payout_count    INT UNSIGNED        NOT NULL DEFAULT 0,
  currency        CHAR(3)             NOT NULL DEFAULT 'USD',
  scheduled_at    DATETIME            NULL,
  processed_at    DATETIME            NULL,
  created_by      BIGINT UNSIGNED     NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_payout_batches_uuid (uuid),
  UNIQUE KEY uk_payout_batches_ref (batch_ref),
  KEY idx_payout_batches_status (status),
  CONSTRAINT fk_payout_batches_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payouts (
  id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                CHAR(36)            NOT NULL,
  payout_ref          VARCHAR(30)         NOT NULL,
  merchant_id         BIGINT UNSIGNED     NOT NULL,
  settlement_id       BIGINT UNSIGNED     NULL,
  bank_account_id     BIGINT UNSIGNED     NULL,
  batch_id            BIGINT UNSIGNED     NULL,
  amount              DECIMAL(18, 2)      NOT NULL,
  fee_amount          DECIMAL(18, 2)      NOT NULL DEFAULT 0.00,
  currency            CHAR(3)             NOT NULL DEFAULT 'USD',
  payout_type         ENUM('manual', 'scheduled') NOT NULL DEFAULT 'manual',
  payout_method       ENUM('bank_transfer', 'instant', 'manual') NOT NULL DEFAULT 'bank_transfer',
  status              ENUM('pending', 'scheduled', 'processing', 'sent', 'confirmed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
  transfer_ref        VARCHAR(50)         NULL,
  failure_reason      VARCHAR(500)        NULL,
  notes               VARCHAR(500)        NULL,
  scheduled_at        DATETIME            NULL,
  processed_at        DATETIME            NULL,
  confirmed_at        DATETIME            NULL,
  approved_by         BIGINT UNSIGNED     NULL,
  approved_at         DATETIME            NULL,
  created_by          BIGINT UNSIGNED     NULL,
  updated_by          BIGINT UNSIGNED     NULL,
  created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at          DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_payouts_uuid (uuid),
  UNIQUE KEY uk_payouts_ref (payout_ref),
  KEY idx_payouts_merchant (merchant_id),
  KEY idx_payouts_settlement (settlement_id),
  KEY idx_payouts_bank_account (bank_account_id),
  KEY idx_payouts_batch (batch_id),
  KEY idx_payouts_status (status),
  KEY idx_payouts_scheduled_at (scheduled_at),
  CONSTRAINT fk_payouts_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_payouts_settlement
    FOREIGN KEY (settlement_id) REFERENCES settlements (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_payouts_bank_account
    FOREIGN KEY (bank_account_id) REFERENCES merchant_bank_accounts (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_payouts_batch
    FOREIGN KEY (batch_id) REFERENCES payout_batches (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_payouts_approved_by
    FOREIGN KEY (approved_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_payouts_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_payouts_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payout_status_history (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  payout_id       BIGINT UNSIGNED     NOT NULL,
  from_status     VARCHAR(30)         NULL,
  to_status       VARCHAR(30)         NOT NULL,
  reason          VARCHAR(500)        NULL,
  changed_by      BIGINT UNSIGNED     NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_payout_status_history_payout (payout_id),
  CONSTRAINT fk_payout_status_history_payout
    FOREIGN KEY (payout_id) REFERENCES payouts (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_payout_status_history_changed_by
    FOREIGN KEY (changed_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
