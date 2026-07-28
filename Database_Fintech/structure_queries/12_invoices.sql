-- =============================================================================
-- 12_invoices.sql
-- Invoice management
-- =============================================================================

CREATE TABLE IF NOT EXISTS invoices (
  id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                CHAR(36)            NOT NULL,
  organization_id     BIGINT UNSIGNED     NOT NULL,
  merchant_id         BIGINT UNSIGNED     NOT NULL,
  customer_id         BIGINT UNSIGNED     NOT NULL,
  payment_link_id     BIGINT UNSIGNED     NULL,
  invoice_number      VARCHAR(30)         NOT NULL,
  reference_number    VARCHAR(50)         NULL,
  issue_date          DATE                NOT NULL,
  due_date            DATE                NOT NULL,
  currency            CHAR(3)             NOT NULL DEFAULT 'USD',
  status              ENUM('draft','sent','viewed','partially_paid','paid','overdue','cancelled','voided') NOT NULL DEFAULT 'draft',
  notes               TEXT                NULL,
  internal_notes      TEXT                NULL,
  tax_amount          DECIMAL(18, 2)      NOT NULL DEFAULT 0.00,
  discount_amount     DECIMAL(18, 2)      NOT NULL DEFAULT 0.00,
  subtotal            DECIMAL(18, 2)      NOT NULL DEFAULT 0.00,
  total               DECIMAL(18, 2)      NOT NULL DEFAULT 0.00,
  amount_paid         DECIMAL(18, 2)      NOT NULL DEFAULT 0.00,
  balance_due         DECIMAL(18, 2)      NOT NULL DEFAULT 0.00,
  sent_at             DATETIME            NULL,
  viewed_at           DATETIME            NULL,
  paid_at             DATETIME            NULL,
  created_by          BIGINT UNSIGNED     NULL,
  updated_by          BIGINT UNSIGNED     NULL,
  created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at          DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_invoices_uuid (uuid),
  UNIQUE KEY uk_invoices_number (invoice_number),
  KEY idx_invoices_org (organization_id),
  KEY idx_invoices_merchant (merchant_id),
  KEY idx_invoices_customer (customer_id),
  KEY idx_invoices_payment_link (payment_link_id),
  KEY idx_invoices_status (status),
  KEY idx_invoices_due_date (due_date),
  KEY idx_invoices_issue_date (issue_date),
  KEY idx_invoices_deleted (deleted_at),
  CONSTRAINT fk_invoices_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_invoices_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_invoices_customer
    FOREIGN KEY (customer_id) REFERENCES customers (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_invoices_payment_link
    FOREIGN KEY (payment_link_id) REFERENCES payment_links (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_invoices_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_invoices_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  invoice_id          BIGINT UNSIGNED     NOT NULL,
  sort_order          INT UNSIGNED        NOT NULL DEFAULT 0,
  description         VARCHAR(500)        NOT NULL,
  quantity            DECIMAL(12, 4)      NOT NULL DEFAULT 1.0000,
  unit_price          DECIMAL(18, 2)      NOT NULL DEFAULT 0.00,
  tax_amount          DECIMAL(18, 2)      NOT NULL DEFAULT 0.00,
  discount_amount     DECIMAL(18, 2)      NOT NULL DEFAULT 0.00,
  line_total          DECIMAL(18, 2)      NOT NULL DEFAULT 0.00,
  created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_invoice_line_items_invoice (invoice_id),
  CONSTRAINT fk_invoice_line_items_invoice
    FOREIGN KEY (invoice_id) REFERENCES invoices (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS invoice_payments (
  id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  invoice_id          BIGINT UNSIGNED     NOT NULL,
  transaction_id      BIGINT UNSIGNED     NULL,
  payment_link_id     BIGINT UNSIGNED     NULL,
  amount              DECIMAL(18, 2)      NOT NULL,
  payment_method      VARCHAR(50)         NULL,
  notes               VARCHAR(255)        NULL,
  created_by          BIGINT UNSIGNED     NULL,
  created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_invoice_payments_invoice (invoice_id),
  KEY idx_invoice_payments_transaction (transaction_id),
  CONSTRAINT fk_invoice_payments_invoice
    FOREIGN KEY (invoice_id) REFERENCES invoices (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_invoice_payments_transaction
    FOREIGN KEY (transaction_id) REFERENCES transactions (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_invoice_payments_payment_link
    FOREIGN KEY (payment_link_id) REFERENCES payment_links (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_invoice_payments_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
