-- =============================================================================
-- 14_subscriptions.sql
-- Subscription plans and customer subscriptions
-- =============================================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                CHAR(36)            NOT NULL,
  organization_id     BIGINT UNSIGNED     NOT NULL,
  merchant_id         BIGINT UNSIGNED     NOT NULL,
  plan_code           VARCHAR(30)         NOT NULL,
  name                VARCHAR(255)        NOT NULL,
  description         TEXT                NULL,
  price               DECIMAL(18, 2)      NOT NULL,
  currency            CHAR(3)             NOT NULL DEFAULT 'USD',
  billing_interval    ENUM('monthly','quarterly','yearly') NOT NULL DEFAULT 'monthly',
  trial_days          INT UNSIGNED        NOT NULL DEFAULT 0,
  status              ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_by          BIGINT UNSIGNED     NULL,
  updated_by          BIGINT UNSIGNED     NULL,
  created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at          DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_subscription_plans_uuid (uuid),
  UNIQUE KEY uk_subscription_plans_code (plan_code),
  KEY idx_subscription_plans_org (organization_id),
  KEY idx_subscription_plans_merchant (merchant_id),
  KEY idx_subscription_plans_status (status),
  CONSTRAINT fk_subscription_plans_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_subscription_plans_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subscriptions (
  id                    BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                  CHAR(36)            NOT NULL,
  organization_id       BIGINT UNSIGNED     NOT NULL,
  merchant_id           BIGINT UNSIGNED     NOT NULL,
  customer_id           BIGINT UNSIGNED     NOT NULL,
  plan_id               BIGINT UNSIGNED     NOT NULL,
  subscription_ref      VARCHAR(30)         NOT NULL,
  status                ENUM('active','paused','cancelled','failed','renewed') NOT NULL DEFAULT 'active',
  start_date            DATE                NOT NULL,
  end_date              DATE                NULL,
  trial_end_date        DATE                NULL,
  next_billing_date     DATE                NULL,
  current_period_start  DATE                NULL,
  current_period_end    DATE                NULL,
  payment_link_id       BIGINT UNSIGNED     NULL,
  renewal_count         INT UNSIGNED        NOT NULL DEFAULT 0,
  created_by            BIGINT UNSIGNED     NULL,
  updated_by            BIGINT UNSIGNED     NULL,
  created_at            DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at            DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_subscriptions_uuid (uuid),
  UNIQUE KEY uk_subscriptions_ref (subscription_ref),
  KEY idx_subscriptions_org (organization_id),
  KEY idx_subscriptions_merchant (merchant_id),
  KEY idx_subscriptions_customer (customer_id),
  KEY idx_subscriptions_plan (plan_id),
  KEY idx_subscriptions_status (status),
  KEY idx_subscriptions_next_billing (next_billing_date),
  CONSTRAINT fk_subscriptions_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_subscriptions_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_subscriptions_customer
    FOREIGN KEY (customer_id) REFERENCES customers (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_subscriptions_plan
    FOREIGN KEY (plan_id) REFERENCES subscription_plans (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_subscriptions_payment_link
    FOREIGN KEY (payment_link_id) REFERENCES payment_links (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subscription_invoices (
  id                BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  subscription_id   BIGINT UNSIGNED     NOT NULL,
  invoice_id        BIGINT UNSIGNED     NOT NULL,
  billing_period    VARCHAR(20)         NULL,
  created_at        DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_subscription_invoice (subscription_id, invoice_id),
  KEY idx_subscription_invoices_invoice (invoice_id),
  CONSTRAINT fk_subscription_invoices_subscription
    FOREIGN KEY (subscription_id) REFERENCES subscriptions (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_subscription_invoices_invoice
    FOREIGN KEY (invoice_id) REFERENCES invoices (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
