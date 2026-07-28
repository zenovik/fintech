-- =============================================================================
-- 08_transaction_management.sql
-- Transaction related entities
-- =============================================================================

CREATE TABLE IF NOT EXISTS transaction_events (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  transaction_id  BIGINT UNSIGNED     NOT NULL,
  event_type      VARCHAR(50)         NOT NULL,
  event_data      JSON                NULL,
  actor_user_id   BIGINT UNSIGNED     NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_transaction_events_uuid (uuid),
  KEY idx_transaction_events_transaction (transaction_id),
  KEY idx_transaction_events_type (event_type),
  CONSTRAINT fk_transaction_events_transaction
    FOREIGN KEY (transaction_id) REFERENCES transactions (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_transaction_events_actor
    FOREIGN KEY (actor_user_id) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transaction_status_history (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  transaction_id  BIGINT UNSIGNED     NOT NULL,
  from_status_id  TINYINT UNSIGNED    NULL,
  to_status_id    TINYINT UNSIGNED    NOT NULL,
  reason          VARCHAR(500)        NULL,
  changed_by      BIGINT UNSIGNED     NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_transaction_status_history_transaction (transaction_id),
  CONSTRAINT fk_transaction_status_history_transaction
    FOREIGN KEY (transaction_id) REFERENCES transactions (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_transaction_status_history_from
    FOREIGN KEY (from_status_id) REFERENCES transaction_statuses (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_transaction_status_history_to
    FOREIGN KEY (to_status_id) REFERENCES transaction_statuses (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_transaction_status_history_changed_by
    FOREIGN KEY (changed_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transaction_refunds (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  transaction_id  BIGINT UNSIGNED     NOT NULL,
  merchant_id     BIGINT UNSIGNED     NOT NULL,
  customer_id     BIGINT UNSIGNED     NULL,
  refund_ref      VARCHAR(30)         NOT NULL,
  refund_type     ENUM('full', 'partial') NOT NULL DEFAULT 'partial',
  amount          DECIMAL(18, 2)      NOT NULL,
  currency        CHAR(3)             NOT NULL DEFAULT 'USD',
  reason          VARCHAR(500)        NULL,
  status          ENUM('pending', 'approved', 'rejected', 'processed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
  requested_by    BIGINT UNSIGNED     NULL,
  approved_by     BIGINT UNSIGNED     NULL,
  rejected_by     BIGINT UNSIGNED     NULL,
  approved_at     DATETIME            NULL,
  rejected_at     DATETIME            NULL,
  rejection_reason VARCHAR(500)       NULL,
  processed_at    DATETIME            NULL,
  created_by      BIGINT UNSIGNED     NULL,
  updated_by      BIGINT UNSIGNED     NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_transaction_refunds_uuid (uuid),
  UNIQUE KEY uk_transaction_refunds_ref (refund_ref),
  KEY idx_transaction_refunds_transaction (transaction_id),
  KEY idx_transaction_refunds_merchant (merchant_id),
  KEY idx_transaction_refunds_customer (customer_id),
  KEY idx_transaction_refunds_status (status),
  KEY idx_transaction_refunds_created_at (created_at),
  CONSTRAINT fk_transaction_refunds_transaction
    FOREIGN KEY (transaction_id) REFERENCES transactions (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_transaction_refunds_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_transaction_refunds_customer
    FOREIGN KEY (customer_id) REFERENCES customers (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_transaction_refunds_requested_by
    FOREIGN KEY (requested_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_transaction_refunds_approved_by
    FOREIGN KEY (approved_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_transaction_refunds_rejected_by
    FOREIGN KEY (rejected_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_transaction_refunds_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_transaction_refunds_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS refund_status_history (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  refund_id       BIGINT UNSIGNED     NOT NULL,
  from_status     VARCHAR(20)         NULL,
  to_status       VARCHAR(20)         NOT NULL,
  reason          VARCHAR(500)        NULL,
  changed_by      BIGINT UNSIGNED     NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_refund_status_history_refund (refund_id),
  CONSTRAINT fk_refund_status_history_refund
    FOREIGN KEY (refund_id) REFERENCES transaction_refunds (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_refund_status_history_changed_by
    FOREIGN KEY (changed_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transaction_fees (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  transaction_id  BIGINT UNSIGNED     NOT NULL,
  fee_type        VARCHAR(50)         NOT NULL,
  amount          DECIMAL(18, 2)      NOT NULL,
  currency        CHAR(3)             NOT NULL DEFAULT 'USD',
  description     VARCHAR(255)        NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_transaction_fees_transaction (transaction_id),
  CONSTRAINT fk_transaction_fees_transaction
    FOREIGN KEY (transaction_id) REFERENCES transactions (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transaction_disputes (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  transaction_id  BIGINT UNSIGNED     NOT NULL,
  merchant_id     BIGINT UNSIGNED     NOT NULL,
  customer_id     BIGINT UNSIGNED     NULL,
  dispute_ref     VARCHAR(30)         NOT NULL,
  reason          VARCHAR(500)        NOT NULL,
  reason_code     ENUM('fraud', 'product_not_received', 'duplicate', 'subscription_cancelled', 'other') NOT NULL DEFAULT 'other',
  card_network    ENUM('visa', 'mastercard', 'amex', 'discover', 'other') NULL DEFAULT 'visa',
  status          ENUM('open', 'evidence_required', 'under_review', 'representment_submitted', 'won', 'lost', 'closed') NOT NULL DEFAULT 'open',
  amount          DECIMAL(18, 2)      NOT NULL,
  currency        CHAR(3)             NOT NULL DEFAULT 'USD',
  evidence_due_at DATETIME            NULL,
  representment_notes TEXT            NULL,
  representment_submitted_at DATETIME NULL,
  representment_submitted_by BIGINT UNSIGNED NULL,
  resolution_notes VARCHAR(500)       NULL,
  resolved_at     DATETIME            NULL,
  resolved_by     BIGINT UNSIGNED     NULL,
  created_by      BIGINT UNSIGNED     NULL,
  updated_by      BIGINT UNSIGNED     NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_transaction_disputes_uuid (uuid),
  UNIQUE KEY uk_transaction_disputes_ref (dispute_ref),
  KEY idx_transaction_disputes_transaction (transaction_id),
  KEY idx_transaction_disputes_merchant (merchant_id),
  KEY idx_transaction_disputes_customer (customer_id),
  KEY idx_transaction_disputes_status (status),
  KEY idx_transaction_disputes_evidence_due (evidence_due_at),
  CONSTRAINT fk_transaction_disputes_transaction
    FOREIGN KEY (transaction_id) REFERENCES transactions (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_transaction_disputes_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_transaction_disputes_customer
    FOREIGN KEY (customer_id) REFERENCES customers (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_transaction_disputes_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_transaction_disputes_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_transaction_disputes_representment_by
    FOREIGN KEY (representment_submitted_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_transaction_disputes_resolved_by
    FOREIGN KEY (resolved_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dispute_evidence (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  dispute_id      BIGINT UNSIGNED     NOT NULL,
  file_name       VARCHAR(255)        NOT NULL,
  file_url        VARCHAR(500)        NOT NULL,
  mime_type       VARCHAR(100)        NULL,
  description     VARCHAR(500)        NULL,
  uploaded_by     BIGINT UNSIGNED     NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at      DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_dispute_evidence_uuid (uuid),
  KEY idx_dispute_evidence_dispute (dispute_id),
  CONSTRAINT fk_dispute_evidence_dispute
    FOREIGN KEY (dispute_id) REFERENCES transaction_disputes (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_dispute_evidence_uploaded_by
    FOREIGN KEY (uploaded_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dispute_status_history (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  dispute_id      BIGINT UNSIGNED     NOT NULL,
  from_status     VARCHAR(30)         NULL,
  to_status       VARCHAR(30)         NOT NULL,
  reason          VARCHAR(500)        NULL,
  changed_by      BIGINT UNSIGNED     NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_dispute_status_history_dispute (dispute_id),
  CONSTRAINT fk_dispute_status_history_dispute
    FOREIGN KEY (dispute_id) REFERENCES transaction_disputes (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_dispute_status_history_changed_by
    FOREIGN KEY (changed_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transaction_notes (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  transaction_id  BIGINT UNSIGNED     NOT NULL,
  author_user_id  BIGINT UNSIGNED     NULL,
  note_text       TEXT                NOT NULL,
  is_internal     TINYINT(1)          NOT NULL DEFAULT 1,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_transaction_notes_uuid (uuid),
  KEY idx_transaction_notes_transaction (transaction_id),
  CONSTRAINT fk_transaction_notes_transaction
    FOREIGN KEY (transaction_id) REFERENCES transactions (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_transaction_notes_author
    FOREIGN KEY (author_user_id) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transaction_exports (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  user_id         BIGINT UNSIGNED     NOT NULL,
  format          ENUM('csv', 'xlsx', 'pdf') NOT NULL DEFAULT 'csv',
  filter_params   JSON                NULL,
  status          ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending',
  file_url        VARCHAR(500)        NULL,
  row_count       INT UNSIGNED        NULL,
  completed_at    DATETIME            NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_transaction_exports_uuid (uuid),
  KEY idx_transaction_exports_user (user_id),
  KEY idx_transaction_exports_status (status),
  CONSTRAINT fk_transaction_exports_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transaction_attachments (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  transaction_id  BIGINT UNSIGNED     NOT NULL,
  file_name       VARCHAR(255)        NOT NULL,
  file_url        VARCHAR(500)        NOT NULL,
  mime_type       VARCHAR(100)        NULL,
  uploaded_by     BIGINT UNSIGNED     NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at      DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_transaction_attachments_uuid (uuid),
  KEY idx_transaction_attachments_transaction (transaction_id),
  CONSTRAINT fk_transaction_attachments_transaction
    FOREIGN KEY (transaction_id) REFERENCES transactions (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_transaction_attachments_uploaded_by
    FOREIGN KEY (uploaded_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
