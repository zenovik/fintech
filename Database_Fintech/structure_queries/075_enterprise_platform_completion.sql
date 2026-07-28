-- =============================================================================
-- 075_enterprise_platform_completion.sql
-- Developer portal, webhooks, reconciliation, sandbox, billing extensions,
-- subscription dunning, production readiness. Extends existing tables only.
-- =============================================================================

-- Developer Platform
CREATE TABLE IF NOT EXISTS developer_profiles (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  user_id         BIGINT UNSIGNED     NOT NULL,
  organization_id BIGINT UNSIGNED     NOT NULL,
  company_name    VARCHAR(255)        NULL,
  website         VARCHAR(500)        NULL,
  sandbox_enabled TINYINT(1)          NOT NULL DEFAULT 1,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_dev_profile_uuid (uuid),
  UNIQUE KEY uk_dev_profile_user (user_id),
  CONSTRAINT fk_dev_profile_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_dev_profile_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE organization_api_keys
  ADD COLUMN permissions_json JSON NULL AFTER key_hash,
  ADD COLUMN rate_limit_per_minute INT UNSIGNED NULL DEFAULT 1000 AFTER permissions_json,
  ADD COLUMN ip_whitelist JSON NULL AFTER rate_limit_per_minute,
  ADD COLUMN webhook_secret_hash VARCHAR(128) NULL AFTER ip_whitelist,
  ADD COLUMN rotated_at DATETIME NULL AFTER webhook_secret_hash;

CREATE TABLE IF NOT EXISTS oauth_applications (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  organization_id BIGINT UNSIGNED     NOT NULL,
  name            VARCHAR(150)        NOT NULL,
  client_id       VARCHAR(64)         NOT NULL,
  client_secret_hash VARCHAR(128)     NOT NULL,
  redirect_uris   JSON                NOT NULL,
  scopes          JSON                NOT NULL,
  environment     ENUM('sandbox','production') NOT NULL DEFAULT 'sandbox',
  status          ENUM('active','revoked') NOT NULL DEFAULT 'active',
  created_by      BIGINT UNSIGNED     NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_oauth_app_uuid (uuid),
  UNIQUE KEY uk_oauth_client_id (client_id),
  KEY idx_oauth_org (organization_id),
  CONSTRAINT fk_oauth_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS api_usage_logs (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  organization_id BIGINT UNSIGNED     NOT NULL,
  api_key_id      BIGINT UNSIGNED     NULL,
  method          VARCHAR(10)         NOT NULL,
  path            VARCHAR(500)        NOT NULL,
  status_code     SMALLINT UNSIGNED   NOT NULL,
  latency_ms      INT UNSIGNED        NULL,
  environment     ENUM('sandbox','production','test','live') NOT NULL DEFAULT 'live',
  ip_address      VARCHAR(45)         NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_api_usage_uuid (uuid),
  KEY idx_api_usage_org_created (organization_id, created_at),
  KEY idx_api_usage_key (api_key_id, created_at),
  CONSTRAINT fk_api_usage_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT fk_api_usage_key FOREIGN KEY (api_key_id) REFERENCES organization_api_keys (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Webhook Platform
ALTER TABLE merchant_webhooks
  ADD COLUMN organization_id BIGINT UNSIGNED NULL AFTER merchant_id,
  ADD COLUMN description VARCHAR(255) NULL AFTER url,
  ADD COLUMN secret_version TINYINT UNSIGNED NOT NULL DEFAULT 1 AFTER secret_hash,
  ADD COLUMN health_status ENUM('healthy','degraded','failing') NOT NULL DEFAULT 'healthy' AFTER is_active,
  ADD COLUMN last_delivery_at DATETIME NULL AFTER health_status,
  ADD COLUMN failure_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER last_delivery_at;

CREATE TABLE IF NOT EXISTS webhook_event_subscriptions (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  webhook_id      BIGINT UNSIGNED     NOT NULL,
  event_category  VARCHAR(50)         NOT NULL,
  event_type      VARCHAR(80)         NOT NULL,
  is_enabled      TINYINT(1)          NOT NULL DEFAULT 1,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_wes_uuid (uuid),
  UNIQUE KEY uk_wes_webhook_event (webhook_id, event_type),
  CONSTRAINT fk_wes_webhook FOREIGN KEY (webhook_id) REFERENCES merchant_webhooks (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS webhook_delivery_queue (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  webhook_id      BIGINT UNSIGNED     NOT NULL,
  merchant_id     BIGINT UNSIGNED     NOT NULL,
  event_type      VARCHAR(80)         NOT NULL,
  payload         JSON                NOT NULL,
  status          ENUM('pending','processing','delivered','failed','dead_letter') NOT NULL DEFAULT 'pending',
  attempt_count   TINYINT UNSIGNED    NOT NULL DEFAULT 0,
  max_attempts    TINYINT UNSIGNED    NOT NULL DEFAULT 5,
  next_retry_at   DATETIME            NULL,
  last_response_code SMALLINT UNSIGNED NULL,
  last_error      VARCHAR(500)        NULL,
  signature       VARCHAR(128)        NULL,
  delivered_at    DATETIME            NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_wdq_uuid (uuid),
  KEY idx_wdq_status_retry (status, next_retry_at),
  KEY idx_wdq_webhook (webhook_id, created_at),
  KEY idx_wdq_merchant (merchant_id, created_at),
  CONSTRAINT fk_wdq_webhook FOREIGN KEY (webhook_id) REFERENCES merchant_webhooks (id) ON DELETE CASCADE,
  CONSTRAINT fk_wdq_merchant FOREIGN KEY (merchant_id) REFERENCES merchants (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS webhook_replay_history (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  delivery_id     BIGINT UNSIGNED     NOT NULL,
  replayed_by     BIGINT UNSIGNED     NULL,
  replay_reason   VARCHAR(255)        NULL,
  replay_status   ENUM('success','failed') NOT NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_wrh_uuid (uuid),
  KEY idx_wrh_delivery (delivery_id),
  CONSTRAINT fk_wrh_delivery FOREIGN KEY (delivery_id) REFERENCES webhook_delivery_queue (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subscription extensions
ALTER TABLE subscription_plans
  MODIFY billing_interval ENUM('daily','weekly','monthly','quarterly','yearly') NOT NULL DEFAULT 'monthly',
  ADD COLUMN dunning_enabled TINYINT(1) NOT NULL DEFAULT 1 AFTER trial_days;

ALTER TABLE subscriptions
  ADD COLUMN paused_at DATETIME NULL AFTER next_billing_date,
  ADD COLUMN cancel_at_period_end TINYINT(1) NOT NULL DEFAULT 0 AFTER paused_at,
  ADD COLUMN dunning_stage TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER cancel_at_period_end,
  ADD COLUMN mandate_id BIGINT UNSIGNED NULL AFTER dunning_stage;

CREATE TABLE IF NOT EXISTS subscription_mandates (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  subscription_id BIGINT UNSIGNED     NOT NULL,
  customer_id     BIGINT UNSIGNED     NOT NULL,
  mandate_ref     VARCHAR(40)         NOT NULL,
  payment_method  VARCHAR(30)         NOT NULL,
  status          ENUM('active','revoked','expired') NOT NULL DEFAULT 'active',
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_sub_mandate_uuid (uuid),
  UNIQUE KEY uk_sub_mandate_ref (mandate_ref),
  CONSTRAINT fk_sub_mandate_sub FOREIGN KEY (subscription_id) REFERENCES subscriptions (id) ON DELETE CASCADE,
  CONSTRAINT fk_sub_mandate_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subscription_dunning_events (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  subscription_id BIGINT UNSIGNED     NOT NULL,
  stage           TINYINT UNSIGNED    NOT NULL,
  action          ENUM('retry','notify','pause','cancel') NOT NULL,
  status          ENUM('pending','completed','failed') NOT NULL DEFAULT 'pending',
  scheduled_at    DATETIME            NOT NULL,
  completed_at    DATETIME            NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_dunning_uuid (uuid),
  KEY idx_dunning_sub (subscription_id, scheduled_at),
  CONSTRAINT fk_dunning_sub FOREIGN KEY (subscription_id) REFERENCES subscriptions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoice / Billing extensions
CREATE TABLE IF NOT EXISTS invoice_templates (
  id              INT UNSIGNED        NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  organization_id BIGINT UNSIGNED     NOT NULL,
  code            VARCHAR(50)         NOT NULL,
  name            VARCHAR(100)        NOT NULL,
  header_html     TEXT                NULL,
  footer_html     TEXT                NULL,
  tax_breakdown   TINYINT(1)          NOT NULL DEFAULT 1,
  is_default      TINYINT(1)          NOT NULL DEFAULT 0,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_inv_tpl_uuid (uuid),
  UNIQUE KEY uk_inv_tpl_org_code (organization_id, code),
  CONSTRAINT fk_inv_tpl_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE invoices
  ADD COLUMN template_id INT UNSIGNED NULL AFTER currency,
  ADD COLUMN credit_note_for_id BIGINT UNSIGNED NULL AFTER template_id,
  ADD COLUMN is_recurring TINYINT(1) NOT NULL DEFAULT 0 AFTER credit_note_for_id,
  ADD COLUMN recurring_schedule JSON NULL AFTER is_recurring,
  ADD COLUMN tax_breakdown_json JSON NULL AFTER recurring_schedule;

CREATE TABLE IF NOT EXISTS credit_notes (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  organization_id BIGINT UNSIGNED     NOT NULL,
  merchant_id     BIGINT UNSIGNED     NOT NULL,
  invoice_id      BIGINT UNSIGNED     NOT NULL,
  credit_ref      VARCHAR(30)         NOT NULL,
  amount          DECIMAL(18, 2)      NOT NULL,
  currency        CHAR(3)             NOT NULL DEFAULT 'USD',
  reason          TEXT                NULL,
  status          ENUM('draft','issued','applied','void') NOT NULL DEFAULT 'draft',
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_credit_uuid (uuid),
  UNIQUE KEY uk_credit_ref (credit_ref),
  CONSTRAINT fk_credit_invoice FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE RESTRICT,
  CONSTRAINT fk_credit_merchant FOREIGN KEY (merchant_id) REFERENCES merchants (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS debit_notes (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  organization_id BIGINT UNSIGNED     NOT NULL,
  merchant_id     BIGINT UNSIGNED     NOT NULL,
  invoice_id      BIGINT UNSIGNED     NULL,
  debit_ref       VARCHAR(30)         NOT NULL,
  amount          DECIMAL(18, 2)      NOT NULL,
  currency        CHAR(3)             NOT NULL DEFAULT 'USD',
  reason          TEXT                NULL,
  status          ENUM('draft','issued','applied','void') NOT NULL DEFAULT 'draft',
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_debit_uuid (uuid),
  UNIQUE KEY uk_debit_ref (debit_ref)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reconciliation Engine
CREATE TABLE IF NOT EXISTS reconciliation_imports (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  organization_id BIGINT UNSIGNED     NOT NULL,
  merchant_id     BIGINT UNSIGNED     NULL,
  import_ref      VARCHAR(40)         NOT NULL,
  source_type     ENUM('csv','excel','api','sftp') NOT NULL,
  file_name       VARCHAR(255)        NULL,
  status          ENUM('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
  total_rows      INT UNSIGNED        NOT NULL DEFAULT 0,
  matched_rows    INT UNSIGNED        NOT NULL DEFAULT 0,
  unmatched_rows  INT UNSIGNED        NOT NULL DEFAULT 0,
  imported_by     BIGINT UNSIGNED     NULL,
  completed_at    DATETIME            NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_recon_import_uuid (uuid),
  UNIQUE KEY uk_recon_import_ref (import_ref),
  KEY idx_recon_import_org (organization_id, created_at),
  CONSTRAINT fk_recon_import_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reconciliation_records (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  import_id       BIGINT UNSIGNED     NOT NULL,
  organization_id BIGINT UNSIGNED     NOT NULL,
  merchant_id     BIGINT UNSIGNED     NULL,
  external_ref    VARCHAR(64)         NOT NULL,
  amount          DECIMAL(18, 2)      NOT NULL,
  currency        CHAR(3)             NOT NULL DEFAULT 'USD',
  record_date     DATE                NOT NULL,
  record_type     ENUM('settlement','refund','chargeback','fee','other') NOT NULL DEFAULT 'settlement',
  match_status    ENUM('unmatched','auto_matched','manual_matched','exception') NOT NULL DEFAULT 'unmatched',
  transaction_id  BIGINT UNSIGNED     NULL,
  settlement_id   BIGINT UNSIGNED     NULL,
  matched_at      DATETIME            NULL,
  matched_by      BIGINT UNSIGNED     NULL,
  metadata        JSON                NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_recon_rec_uuid (uuid),
  KEY idx_recon_rec_import (import_id),
  KEY idx_recon_rec_status (match_status, record_date),
  KEY idx_recon_rec_org (organization_id, record_date),
  CONSTRAINT fk_recon_rec_import FOREIGN KEY (import_id) REFERENCES reconciliation_imports (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Disputes extensions (chargebacks)
ALTER TABLE transaction_disputes
  ADD COLUMN sla_due_at DATETIME NULL AFTER evidence_due_at,
  ADD COLUMN representment_status ENUM('none','pending','submitted','won','lost') NOT NULL DEFAULT 'none' AFTER sla_due_at,
  ADD COLUMN arbitration_status ENUM('none','pending','resolved') NOT NULL DEFAULT 'none' AFTER representment_status;

-- Sandbox
CREATE TABLE IF NOT EXISTS sandbox_accounts (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  organization_id BIGINT UNSIGNED     NOT NULL,
  merchant_id     BIGINT UNSIGNED     NULL,
  account_name    VARCHAR(100)        NOT NULL,
  api_key_prefix  VARCHAR(32)         NOT NULL,
  status          ENUM('active','archived') NOT NULL DEFAULT 'active',
  created_by      BIGINT UNSIGNED     NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_sandbox_uuid (uuid),
  KEY idx_sandbox_org (organization_id),
  CONSTRAINT fk_sandbox_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sandbox_test_cards (
  id              INT UNSIGNED        NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  card_number     VARCHAR(20)         NOT NULL,
  brand           VARCHAR(20)         NOT NULL,
  scenario        ENUM('success','decline','insufficient_funds','fraud','timeout') NOT NULL DEFAULT 'success',
  description     VARCHAR(255)        NULL,
  is_active       TINYINT(1)          NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uk_test_card_uuid (uuid),
  UNIQUE KEY uk_test_card_number (card_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sandbox_simulations (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  organization_id BIGINT UNSIGNED     NOT NULL,
  simulation_type ENUM('payment_failure','payment_delay','webhook_failure','webhook_delay') NOT NULL,
  config_json     JSON                NOT NULL,
  is_enabled      TINYINT(1)          NOT NULL DEFAULT 0,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_sandbox_sim_uuid (uuid),
  KEY idx_sandbox_sim_org (organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Production Platform
CREATE TABLE IF NOT EXISTS cache_configurations (
  id              INT UNSIGNED        NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  cache_key       VARCHAR(100)        NOT NULL,
  provider        ENUM('memory','redis') NOT NULL DEFAULT 'memory',
  ttl_seconds     INT UNSIGNED        NOT NULL DEFAULT 300,
  is_enabled      TINYINT(1)          NOT NULL DEFAULT 1,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_cache_cfg_key (cache_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS backup_configurations (
  id              INT UNSIGNED        NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  backup_type     ENUM('database','files','full') NOT NULL,
  schedule_cron   VARCHAR(50)         NOT NULL,
  retention_days  INT UNSIGNED        NOT NULL DEFAULT 30,
  destination     VARCHAR(500)        NOT NULL,
  is_enabled      TINYINT(1)          NOT NULL DEFAULT 1,
  last_run_at     DATETIME            NULL,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_backup_cfg_uuid (uuid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ai_insights_daily (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  organization_id BIGINT UNSIGNED     NOT NULL,
  merchant_id     BIGINT UNSIGNED     NULL,
  insight_date    DATE                NOT NULL,
  revenue_forecast DECIMAL(18, 2)     NULL,
  settlement_forecast DECIMAL(18, 2)  NULL,
  merchant_health_score DECIMAL(5, 2)  NULL,
  fraud_risk_score DECIMAL(5, 2)      NULL,
  insights_json   JSON                NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ai_insights (organization_id, merchant_id, insight_date),
  KEY idx_ai_insights_date (insight_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS communication_campaigns (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  organization_id BIGINT UNSIGNED     NOT NULL,
  name            VARCHAR(150)        NOT NULL,
  channel         ENUM('email','sms','whatsapp','push') NOT NULL,
  template_id     BIGINT UNSIGNED     NULL,
  status          ENUM('draft','scheduled','running','completed','cancelled') NOT NULL DEFAULT 'draft',
  scheduled_at    DATETIME            NULL,
  sent_count      INT UNSIGNED        NOT NULL DEFAULT 0,
  created_by      BIGINT UNSIGNED     NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_comm_campaign_uuid (uuid),
  KEY idx_comm_campaign_org (organization_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Security extensions
ALTER TABLE security_settings
  ADD COLUMN api_ip_restrictions JSON NULL AFTER ip_whitelist,
  ADD COLUMN geo_login_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER api_ip_restrictions,
  ADD COLUMN risk_login_threshold TINYINT UNSIGNED NOT NULL DEFAULT 70 AFTER geo_login_enabled;

CREATE TABLE IF NOT EXISTS api_rate_limits (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  organization_id BIGINT UNSIGNED     NOT NULL,
  resource        VARCHAR(80)         NOT NULL,
  limit_per_minute INT UNSIGNED       NOT NULL DEFAULT 1000,
  limit_per_day   INT UNSIGNED        NOT NULL DEFAULT 100000,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_rate_limit_org_resource (organization_id, resource),
  CONSTRAINT fk_rate_limit_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
