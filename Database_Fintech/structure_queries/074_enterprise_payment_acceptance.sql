-- =============================================================================
-- 074_enterprise_payment_acceptance.sql
-- Enterprise Payment Acceptance: QR platform, payment links, smart collect,
-- customer experience, analytics rollups. Extends existing tables only.
-- =============================================================================

-- QR platform extensions
CREATE TABLE IF NOT EXISTS qr_templates (
  id              INT UNSIGNED        NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  code            VARCHAR(50)         NOT NULL,
  name            VARCHAR(100)        NOT NULL,
  layout          ENUM('standard','branded','minimal','print') NOT NULL DEFAULT 'standard',
  logo_position   ENUM('top','center','none') NOT NULL DEFAULT 'top',
  primary_color   VARCHAR(20)         NOT NULL DEFAULT '#003d9b',
  frame_style     VARCHAR(30)         NOT NULL DEFAULT 'rounded',
  print_ready     TINYINT(1)          NOT NULL DEFAULT 1,
  is_active       TINYINT(1)          NOT NULL DEFAULT 1,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_qr_templates_uuid (uuid),
  UNIQUE KEY uk_qr_templates_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS qr_categories (
  id              INT UNSIGNED        NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  organization_id BIGINT UNSIGNED     NOT NULL,
  code            VARCHAR(50)         NOT NULL,
  name            VARCHAR(100)        NOT NULL,
  description     VARCHAR(255)        NULL,
  is_active       TINYINT(1)          NOT NULL DEFAULT 1,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_qr_cat_uuid (uuid),
  UNIQUE KEY uk_qr_cat_org_code (organization_id, code),
  CONSTRAINT fk_qr_cat_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS qr_tags (
  id              INT UNSIGNED        NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  organization_id BIGINT UNSIGNED     NOT NULL,
  name            VARCHAR(60)         NOT NULL,
  color           VARCHAR(20)         NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_qr_tags_uuid (uuid),
  UNIQUE KEY uk_qr_tags_org_name (organization_id, name),
  CONSTRAINT fk_qr_tags_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE qr_codes
  MODIFY qr_type ENUM('static','dynamic','intent','merchant','customer','outlet','device','table','multi') NOT NULL DEFAULT 'static',
  MODIFY status ENUM('active','disabled','archived','expired') NOT NULL DEFAULT 'active',
  ADD COLUMN device_id BIGINT UNSIGNED NULL AFTER outlet_id,
  ADD COLUMN template_id INT UNSIGNED NULL AFTER table_label,
  ADD COLUMN category_id INT UNSIGNED NULL AFTER template_id,
  ADD COLUMN tag_ids JSON NULL AFTER category_id,
  ADD COLUMN is_one_time TINYINT(1) NOT NULL DEFAULT 0 AFTER allow_custom_amount,
  ADD COLUMN is_reusable TINYINT(1) NOT NULL DEFAULT 1 AFTER is_one_time,
  ADD COLUMN amount_locked TINYINT(1) NOT NULL DEFAULT 0 AFTER is_reusable,
  ADD COLUMN usage_limit INT UNSIGNED NULL AFTER amount_locked,
  ADD COLUMN usage_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER usage_limit,
  ADD COLUMN intent_ref VARCHAR(40) NULL AFTER usage_count,
  ADD COLUMN branding_json JSON NULL AFTER intent_ref,
  ADD COLUMN clone_of_id BIGINT UNSIGNED NULL AFTER branding_json,
  ADD COLUMN archived_at DATETIME NULL AFTER updated_at,
  ADD KEY idx_qr_codes_device (device_id),
  ADD KEY idx_qr_codes_category (category_id),
  ADD KEY idx_qr_codes_template (template_id),
  ADD KEY idx_qr_codes_intent (intent_ref),
  ADD KEY idx_qr_codes_archived (archived_at),
  ADD CONSTRAINT fk_qr_codes_device FOREIGN KEY (device_id) REFERENCES payment_devices (id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_qr_codes_template FOREIGN KEY (template_id) REFERENCES qr_templates (id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_qr_codes_category FOREIGN KEY (category_id) REFERENCES qr_categories (id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_qr_codes_clone FOREIGN KEY (clone_of_id) REFERENCES qr_codes (id) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS qr_scan_history (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  qr_code_id      BIGINT UNSIGNED     NOT NULL,
  organization_id BIGINT UNSIGNED     NOT NULL,
  merchant_id     BIGINT UNSIGNED     NOT NULL,
  scan_result     ENUM('viewed','paid','failed','expired') NOT NULL DEFAULT 'viewed',
  paid_amount     DECIMAL(18, 2)      NULL,
  transaction_id  BIGINT UNSIGNED     NULL,
  ip_address      VARCHAR(45)         NULL,
  user_agent      VARCHAR(512)        NULL,
  browser         VARCHAR(100)        NULL,
  os_name         VARCHAR(50)         NULL,
  device_type     VARCHAR(30)         NULL,
  country_code    CHAR(2)             NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_qr_scan_uuid (uuid),
  KEY idx_qr_scan_qr (qr_code_id, created_at),
  KEY idx_qr_scan_merchant (merchant_id, created_at),
  KEY idx_qr_scan_org (organization_id, created_at),
  CONSTRAINT fk_qr_scan_qr FOREIGN KEY (qr_code_id) REFERENCES qr_codes (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_qr_scan_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_qr_scan_merchant FOREIGN KEY (merchant_id) REFERENCES merchants (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_qr_scan_tx FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment link enterprise extensions
ALTER TABLE payment_links
  ADD COLUMN short_code VARCHAR(16) NULL AFTER public_token,
  ADD COLUMN password_hash VARCHAR(255) NULL AFTER short_code,
  ADD COLUMN min_amount DECIMAL(18, 2) NULL AFTER amount,
  ADD COLUMN max_amount DECIMAL(18, 2) NULL AFTER min_amount,
  ADD COLUMN allow_partial TINYINT(1) NOT NULL DEFAULT 0 AFTER allow_custom_amount,
  ADD COLUMN is_one_time TINYINT(1) NOT NULL DEFAULT 0 AFTER allow_partial,
  ADD COLUMN is_reusable TINYINT(1) NOT NULL DEFAULT 1 AFTER is_one_time,
  ADD COLUMN invoice_id BIGINT UNSIGNED NULL AFTER customer_id,
  ADD COLUMN customer_email VARCHAR(255) NULL AFTER invoice_id,
  ADD COLUMN customer_phone VARCHAR(30) NULL AFTER customer_email,
  ADD COLUMN merchant_notes TEXT NULL AFTER customer_phone,
  ADD COLUMN customer_notes TEXT NULL AFTER merchant_notes,
  ADD COLUMN visit_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER current_usage,
  ADD COLUMN payment_started_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER visit_count,
  ADD COLUMN abandonment_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER payment_started_count,
  ADD COLUMN clone_of_id BIGINT UNSIGNED NULL AFTER abandonment_count,
  ADD COLUMN reminder_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER clone_of_id,
  ADD COLUMN reminder_config JSON NULL AFTER reminder_enabled,
  ADD UNIQUE KEY uk_payment_links_short (short_code),
  ADD KEY idx_payment_links_invoice (invoice_id),
  ADD CONSTRAINT fk_payment_links_invoice FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_payment_links_clone FOREIGN KEY (clone_of_id) REFERENCES payment_links (id) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS payment_link_visits (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  payment_link_id BIGINT UNSIGNED     NOT NULL,
  visit_type      ENUM('view','start','abandon','complete') NOT NULL DEFAULT 'view',
  ip_address      VARCHAR(45)         NULL,
  user_agent      VARCHAR(512)        NULL,
  browser         VARCHAR(100)        NULL,
  country_code    CHAR(2)             NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_pl_visit_uuid (uuid),
  KEY idx_pl_visit_link (payment_link_id, created_at),
  CONSTRAINT fk_pl_visit_link FOREIGN KEY (payment_link_id) REFERENCES payment_links (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_link_events (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  payment_link_id BIGINT UNSIGNED     NOT NULL,
  event_type      ENUM('created','viewed','payment_started','completed','failed','expired','disabled','reminder_sent','cloned') NOT NULL,
  metadata        JSON                NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_pl_event_uuid (uuid),
  KEY idx_pl_event_link (payment_link_id, created_at),
  KEY idx_pl_event_type (event_type, created_at),
  CONSTRAINT fk_pl_event_link FOREIGN KEY (payment_link_id) REFERENCES payment_links (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_link_reminders (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  payment_link_id BIGINT UNSIGNED     NOT NULL,
  channel         ENUM('email','sms','whatsapp') NOT NULL,
  scheduled_at    DATETIME            NOT NULL,
  sent_at         DATETIME            NULL,
  status          ENUM('pending','sent','failed','cancelled') NOT NULL DEFAULT 'pending',
  retry_count     TINYINT UNSIGNED    NOT NULL DEFAULT 0,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_pl_reminder_uuid (uuid),
  KEY idx_pl_reminder_sched (status, scheduled_at),
  CONSTRAINT fk_pl_reminder_link FOREIGN KEY (payment_link_id) REFERENCES payment_links (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Smart Collect
CREATE TABLE IF NOT EXISTS virtual_accounts (
  id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                CHAR(36)            NOT NULL,
  organization_id     BIGINT UNSIGNED     NOT NULL,
  merchant_id         BIGINT UNSIGNED     NOT NULL,
  customer_id         BIGINT UNSIGNED     NULL,
  outlet_id           BIGINT UNSIGNED     NULL,
  account_ref         VARCHAR(40)         NOT NULL,
  account_number      VARCHAR(40)         NOT NULL,
  ifsc_code           VARCHAR(20)         NULL,
  bank_name           VARCHAR(100)        NULL,
  account_type        ENUM('dedicated','temporary','shared') NOT NULL DEFAULT 'dedicated',
  currency            CHAR(3)             NOT NULL DEFAULT 'INR',
  expected_amount     DECIMAL(18, 2)      NULL,
  status              ENUM('active','inactive','expired','closed') NOT NULL DEFAULT 'active',
  expires_at          DATETIME            NULL,
  metadata            JSON                NULL,
  created_by          BIGINT UNSIGNED     NULL,
  created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_va_uuid (uuid),
  UNIQUE KEY uk_va_ref (account_ref),
  UNIQUE KEY uk_va_number (account_number),
  KEY idx_va_merchant (merchant_id, status),
  KEY idx_va_org (organization_id),
  KEY idx_va_customer (customer_id),
  CONSTRAINT fk_va_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_va_merchant FOREIGN KEY (merchant_id) REFERENCES merchants (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_va_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_va_outlet FOREIGN KEY (outlet_id) REFERENCES merchant_outlets (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS collections (
  id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                CHAR(36)            NOT NULL,
  organization_id     BIGINT UNSIGNED     NOT NULL,
  merchant_id         BIGINT UNSIGNED     NOT NULL,
  virtual_account_id  BIGINT UNSIGNED     NOT NULL,
  customer_id         BIGINT UNSIGNED     NULL,
  collection_ref      VARCHAR(40)         NOT NULL,
  amount              DECIMAL(18, 2)      NOT NULL,
  currency            CHAR(3)             NOT NULL DEFAULT 'INR',
  utr_reference       VARCHAR(64)         NULL,
  payer_name          VARCHAR(255)        NULL,
  payer_account       VARCHAR(40)         NULL,
  status              ENUM('pending','matched','unmatched','partial','failed','refunded') NOT NULL DEFAULT 'pending',
  match_type          ENUM('auto','manual','none') NOT NULL DEFAULT 'none',
  matched_at          DATETIME            NULL,
  matched_by          BIGINT UNSIGNED     NULL,
  transaction_id      BIGINT UNSIGNED     NULL,
  received_at         DATETIME            NOT NULL,
  notes               TEXT                NULL,
  created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_collections_uuid (uuid),
  UNIQUE KEY uk_collections_ref (collection_ref),
  KEY idx_collections_va (virtual_account_id, status),
  KEY idx_collections_merchant (merchant_id, received_at),
  KEY idx_collections_status (status, received_at),
  CONSTRAINT fk_coll_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_coll_merchant FOREIGN KEY (merchant_id) REFERENCES merchants (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_coll_va FOREIGN KEY (virtual_account_id) REFERENCES virtual_accounts (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_coll_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_coll_tx FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS collection_events (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  collection_id   BIGINT UNSIGNED     NOT NULL,
  event_type      ENUM('received','auto_match','manual_match','unmatched','notified','failed','refunded') NOT NULL,
  metadata        JSON                NULL,
  actor_id        BIGINT UNSIGNED     NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_coll_event_uuid (uuid),
  KEY idx_coll_event (collection_id, created_at),
  CONSTRAINT fk_coll_event FOREIGN KEY (collection_id) REFERENCES collections (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customer experience
CREATE TABLE IF NOT EXISTS customer_preferences (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  customer_id     BIGINT UNSIGNED     NOT NULL,
  organization_id BIGINT UNSIGNED     NOT NULL,
  locale          VARCHAR(10)         NOT NULL DEFAULT 'en-US',
  currency        CHAR(3)             NOT NULL DEFAULT 'USD',
  default_payment_method VARCHAR(30)  NULL,
  communication_channel ENUM('email','sms','whatsapp','none') NOT NULL DEFAULT 'email',
  marketing_opt_in TINYINT(1)         NOT NULL DEFAULT 0,
  dark_mode       TINYINT(1)          NOT NULL DEFAULT 0,
  notes           TEXT                NULL,
  preferences_json JSON               NULL,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_cust_pref_uuid (uuid),
  UNIQUE KEY uk_cust_pref_customer (customer_id),
  CONSTRAINT fk_cust_pref_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cust_pref_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS merchant_branding_assets (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  merchant_id     BIGINT UNSIGNED     NOT NULL,
  organization_id BIGINT UNSIGNED     NOT NULL,
  asset_type      ENUM('logo','favicon','banner','qr_frame','receipt_header') NOT NULL,
  asset_url       VARCHAR(500)        NOT NULL,
  is_default      TINYINT(1)          NOT NULL DEFAULT 0,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_mba_uuid (uuid),
  KEY idx_mba_merchant (merchant_id, asset_type),
  CONSTRAINT fk_mba_merchant FOREIGN KEY (merchant_id) REFERENCES merchants (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_mba_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Analytics rollups
CREATE TABLE IF NOT EXISTS acceptance_analytics_daily (
  id                      BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  organization_id         BIGINT UNSIGNED     NOT NULL,
  merchant_id             BIGINT UNSIGNED     NOT NULL,
  analytics_date          DATE                NOT NULL,
  qr_scans                INT UNSIGNED        NOT NULL DEFAULT 0,
  qr_payments             INT UNSIGNED        NOT NULL DEFAULT 0,
  qr_amount               DECIMAL(18, 2)      NOT NULL DEFAULT 0,
  link_visits             INT UNSIGNED        NOT NULL DEFAULT 0,
  link_payments           INT UNSIGNED        NOT NULL DEFAULT 0,
  link_abandonments       INT UNSIGNED        NOT NULL DEFAULT 0,
  link_amount             DECIMAL(18, 2)      NOT NULL DEFAULT 0,
  collections_received    INT UNSIGNED        NOT NULL DEFAULT 0,
  collections_matched     INT UNSIGNED        NOT NULL DEFAULT 0,
  collections_amount      DECIMAL(18, 2)      NOT NULL DEFAULT 0,
  conversion_rate         DECIMAL(6, 3)       NOT NULL DEFAULT 0,
  retry_rate              DECIMAL(6, 3)       NOT NULL DEFAULT 0,
  top_payment_method      VARCHAR(30)         NULL,
  created_at              DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_accept_analytics (merchant_id, analytics_date),
  KEY idx_accept_analytics_org (organization_id, analytics_date),
  CONSTRAINT fk_accept_analytics_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_accept_analytics_merchant FOREIGN KEY (merchant_id) REFERENCES merchants (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
