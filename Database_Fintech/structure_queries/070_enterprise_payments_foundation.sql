-- =============================================================================
-- 070_enterprise_payments_foundation.sql
-- Payment methods config, devices, QR extensions, settlement engine, pricing,
-- transaction limits, risk rules, fraud cases, terminal inventory, accounting
-- =============================================================================

INSERT INTO payment_method_types (id, code, name, icon_key, is_active) VALUES
(9,  'tap_to_pay',  'Tap To Pay',  'contactless', 1),
(10, 'softpos',     'SoftPOS',     'phone_android', 1),
(11, 'soundbox',    'Soundbox',    'volume_up', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Extended merchant payment method configuration
CREATE TABLE IF NOT EXISTS merchant_payment_method_config (
  id                      BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                    CHAR(36)            NOT NULL,
  merchant_id             BIGINT UNSIGNED     NOT NULL,
  organization_id         BIGINT UNSIGNED     NOT NULL,
  payment_method_type_id  TINYINT UNSIGNED    NOT NULL,
  status                  ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
  settlement_cycle        ENUM('t0','t1','t2','weekly','monthly','instant') NOT NULL DEFAULT 't1',
  mdr_pct                 DECIMAL(6, 4)       NOT NULL DEFAULT 0.0000,
  fixed_fee               DECIMAL(10, 2)      NOT NULL DEFAULT 0.00,
  min_fee                 DECIMAL(10, 2)      NOT NULL DEFAULT 0.00,
  max_fee                 DECIMAL(10, 2)      NULL,
  daily_limit             DECIMAL(18, 2)      NULL,
  per_txn_limit           DECIMAL(18, 2)      NULL,
  risk_rule_set_id        BIGINT UNSIGNED     NULL,
  created_by              BIGINT UNSIGNED     NULL,
  updated_by              BIGINT UNSIGNED     NULL,
  created_at              DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_mpmc_uuid (uuid),
  UNIQUE KEY uk_mpmc_merchant_method (merchant_id, payment_method_type_id),
  KEY idx_mpmc_org (organization_id),
  KEY idx_mpmc_status (status),
  CONSTRAINT fk_mpmc_merchant FOREIGN KEY (merchant_id) REFERENCES merchants (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_mpmc_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_mpmc_method FOREIGN KEY (payment_method_type_id) REFERENCES payment_method_types (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_mpmc_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_mpmc_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment devices
CREATE TABLE IF NOT EXISTS payment_devices (
  id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                CHAR(36)            NOT NULL,
  device_ref          VARCHAR(30)         NOT NULL,
  serial_number       VARCHAR(100)        NOT NULL,
  device_id           VARCHAR(100)        NOT NULL,
  device_type         ENUM('pos','mpos','softpos','android_pos','qr_stand','soundbox') NOT NULL,
  model               VARCHAR(100)        NULL,
  manufacturer        VARCHAR(100)        NULL,
  firmware_version    VARCHAR(50)         NULL,
  status              ENUM('provisioned','active','inactive','deactivated','replaced') NOT NULL DEFAULT 'provisioned',
  merchant_id         BIGINT UNSIGNED     NULL,
  outlet_id           BIGINT UNSIGNED     NULL,
  organization_id     BIGINT UNSIGNED     NOT NULL,
  assigned_user_id    BIGINT UNSIGNED     NULL,
  activated_at        DATETIME            NULL,
  last_sync_at        DATETIME            NULL,
  health_status       ENUM('healthy','warning','critical','offline') NOT NULL DEFAULT 'healthy',
  battery_pct         TINYINT UNSIGNED    NULL,
  sim_number          VARCHAR(30)         NULL,
  network_type        VARCHAR(30)         NULL,
  latitude            DECIMAL(10, 7)      NULL,
  longitude           DECIMAL(10, 7)      NULL,
  location_label      VARCHAR(255)        NULL,
  replaced_by_id      BIGINT UNSIGNED     NULL,
  created_by          BIGINT UNSIGNED     NULL,
  updated_by          BIGINT UNSIGNED     NULL,
  created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at          DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_payment_devices_uuid (uuid),
  UNIQUE KEY uk_payment_devices_ref (device_ref),
  UNIQUE KEY uk_payment_devices_serial (serial_number),
  KEY idx_payment_devices_merchant (merchant_id),
  KEY idx_payment_devices_outlet (outlet_id),
  KEY idx_payment_devices_org (organization_id),
  KEY idx_payment_devices_status (status),
  KEY idx_payment_devices_type (device_type),
  KEY idx_payment_devices_health (health_status),
  CONSTRAINT fk_pd_merchant FOREIGN KEY (merchant_id) REFERENCES merchants (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_pd_outlet FOREIGN KEY (outlet_id) REFERENCES merchant_outlets (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_pd_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_pd_assigned_user FOREIGN KEY (assigned_user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_pd_replaced_by FOREIGN KEY (replaced_by_id) REFERENCES payment_devices (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_pd_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_pd_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS device_sync_logs (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  device_id       BIGINT UNSIGNED     NOT NULL,
  sync_status     ENUM('success','partial','failed') NOT NULL DEFAULT 'success',
  battery_pct     TINYINT UNSIGNED    NULL,
  network_type    VARCHAR(30)         NULL,
  firmware_version VARCHAR(50)        NULL,
  health_status   ENUM('healthy','warning','critical','offline') NOT NULL DEFAULT 'healthy',
  synced_at       DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_device_sync_device (device_id, synced_at DESC),
  CONSTRAINT fk_dsl_device FOREIGN KEY (device_id) REFERENCES payment_devices (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Terminal inventory
CREATE TABLE IF NOT EXISTS terminal_inventory (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  inventory_ref   VARCHAR(30)         NOT NULL,
  serial_number   VARCHAR(100)        NOT NULL,
  device_type     ENUM('pos','mpos','softpos','android_pos','qr_stand','soundbox') NOT NULL,
  model           VARCHAR(100)        NULL,
  manufacturer    VARCHAR(100)        NULL,
  warehouse_code  VARCHAR(50)         NOT NULL DEFAULT 'MAIN',
  status          ENUM('in_stock','assigned','returned','damaged','lost','replacement') NOT NULL DEFAULT 'in_stock',
  device_id       BIGINT UNSIGNED     NULL,
  organization_id BIGINT UNSIGNED     NOT NULL,
  notes           TEXT                NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_terminal_inventory_uuid (uuid),
  UNIQUE KEY uk_terminal_inventory_ref (inventory_ref),
  UNIQUE KEY uk_terminal_inventory_serial (serial_number),
  KEY idx_terminal_inventory_status (status),
  KEY idx_terminal_inventory_warehouse (warehouse_code),
  CONSTRAINT fk_ti_device FOREIGN KEY (device_id) REFERENCES payment_devices (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_ti_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- QR extensions
ALTER TABLE qr_codes
  MODIFY qr_type ENUM('static','dynamic','merchant','customer','outlet','table','multi') NOT NULL DEFAULT 'static',
  ADD COLUMN outlet_id BIGINT UNSIGNED NULL AFTER merchant_id,
  ADD COLUMN table_label VARCHAR(50) NULL AFTER outlet_id,
  ADD COLUMN parent_qr_id BIGINT UNSIGNED NULL AFTER table_label,
  ADD KEY idx_qr_codes_outlet (outlet_id),
  ADD CONSTRAINT fk_qr_codes_outlet FOREIGN KEY (outlet_id) REFERENCES merchant_outlets (id) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_qr_codes_parent FOREIGN KEY (parent_qr_id) REFERENCES qr_codes (id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Settlement engine extensions
CREATE TABLE IF NOT EXISTS settlement_calendar (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  calendar_date   DATE                NOT NULL,
  is_holiday      TINYINT(1)          NOT NULL DEFAULT 0,
  holiday_name    VARCHAR(100)        NULL,
  region_code     VARCHAR(10)         NULL,
  organization_id BIGINT UNSIGNED     NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_settlement_calendar (calendar_date, region_code, organization_id),
  KEY idx_settlement_calendar_holiday (is_holiday, calendar_date),
  CONSTRAINT fk_sc_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE settlements
  MODIFY settlement_cycle ENUM('t0','t1','t2','daily','weekly','monthly','instant') NULL,
  ADD COLUMN hold_status ENUM('none','held','released') NOT NULL DEFAULT 'none' AFTER status,
  ADD COLUMN hold_reason VARCHAR(500) NULL AFTER hold_status,
  ADD COLUMN reserve_amount DECIMAL(18, 2) NOT NULL DEFAULT 0.00 AFTER adjustment_amount,
  ADD COLUMN retry_count TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER hold_reason,
  ADD KEY idx_settlements_hold (hold_status);

CREATE TABLE IF NOT EXISTS settlement_holds (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  settlement_id   BIGINT UNSIGNED     NOT NULL,
  hold_type       ENUM('manual','risk','fraud','compliance') NOT NULL DEFAULT 'manual',
  amount          DECIMAL(18, 2)      NOT NULL,
  reason          VARCHAR(500)        NULL,
  status          ENUM('active','released') NOT NULL DEFAULT 'active',
  held_by         BIGINT UNSIGNED     NULL,
  released_by     BIGINT UNSIGNED     NULL,
  held_at         DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  released_at     DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_settlement_holds_uuid (uuid),
  KEY idx_settlement_holds_settlement (settlement_id),
  KEY idx_settlement_holds_status (status),
  CONSTRAINT fk_sh_settlement FOREIGN KEY (settlement_id) REFERENCES settlements (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_sh_held_by FOREIGN KEY (held_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_sh_released_by FOREIGN KEY (released_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settlement_reserves (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  merchant_id     BIGINT UNSIGNED     NOT NULL,
  reserve_type    ENUM('rolling','fixed','minimum_balance') NOT NULL DEFAULT 'rolling',
  reserve_pct     DECIMAL(5, 2)       NULL,
  reserve_amount  DECIMAL(18, 2)      NOT NULL DEFAULT 0.00,
  currency        CHAR(3)             NOT NULL DEFAULT 'USD',
  status          ENUM('active','released') NOT NULL DEFAULT 'active',
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  released_at     DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_settlement_reserves_uuid (uuid),
  KEY idx_settlement_reserves_merchant (merchant_id),
  CONSTRAINT fk_sr_merchant FOREIGN KEY (merchant_id) REFERENCES merchants (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pricing engine
CREATE TABLE IF NOT EXISTS pricing_plans (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  plan_code       VARCHAR(40)         NOT NULL,
  plan_name       VARCHAR(100)        NOT NULL,
  scope_type      ENUM('default','organization','merchant','category') NOT NULL DEFAULT 'default',
  organization_id BIGINT UNSIGNED     NULL,
  merchant_id     BIGINT UNSIGNED     NULL,
  category_code   VARCHAR(50)         NULL,
  is_active       TINYINT(1)          NOT NULL DEFAULT 1,
  effective_from  DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  effective_to    DATETIME            NULL,
  created_by      BIGINT UNSIGNED     NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_pricing_plans_uuid (uuid),
  UNIQUE KEY uk_pricing_plans_code (plan_code),
  KEY idx_pricing_plans_scope (scope_type, organization_id, merchant_id),
  CONSTRAINT fk_pp_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pp_merchant FOREIGN KEY (merchant_id) REFERENCES merchants (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pp_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pricing_fee_rules (
  id                      BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  pricing_plan_id         BIGINT UNSIGNED     NOT NULL,
  payment_method_type_id  TINYINT UNSIGNED    NULL,
  fee_type                ENUM('mdr','fixed','percentage') NOT NULL DEFAULT 'mdr',
  mdr_pct                 DECIMAL(6, 4)       NULL,
  fixed_fee               DECIMAL(10, 2)      NULL,
  percentage_fee          DECIMAL(6, 4)       NULL,
  min_fee                 DECIMAL(10, 2)      NULL,
  max_fee                 DECIMAL(10, 2)      NULL,
  created_at              DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pfr_plan (pricing_plan_id),
  CONSTRAINT fk_pfr_plan FOREIGN KEY (pricing_plan_id) REFERENCES pricing_plans (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_pfr_method FOREIGN KEY (payment_method_type_id) REFERENCES payment_method_types (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Transaction limits
CREATE TABLE IF NOT EXISTS transaction_limit_rules (
  id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                CHAR(36)            NOT NULL,
  rule_name           VARCHAR(100)        NOT NULL,
  scope_type          ENUM('merchant','outlet','device','global') NOT NULL DEFAULT 'merchant',
  merchant_id         BIGINT UNSIGNED     NULL,
  outlet_id           BIGINT UNSIGNED     NULL,
  device_id           BIGINT UNSIGNED     NULL,
  organization_id     BIGINT UNSIGNED     NOT NULL,
  per_txn_limit       DECIMAL(18, 2)      NULL,
  daily_limit         DECIMAL(18, 2)      NULL,
  weekly_limit        DECIMAL(18, 2)      NULL,
  monthly_limit       DECIMAL(18, 2)      NULL,
  is_active           TINYINT(1)          NOT NULL DEFAULT 1,
  created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_tlr_uuid (uuid),
  KEY idx_tlr_merchant (merchant_id),
  KEY idx_tlr_scope (scope_type, organization_id),
  CONSTRAINT fk_tlr_merchant FOREIGN KEY (merchant_id) REFERENCES merchants (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_tlr_outlet FOREIGN KEY (outlet_id) REFERENCES merchant_outlets (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_tlr_device FOREIGN KEY (device_id) REFERENCES payment_devices (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_tlr_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Risk rule engine
CREATE TABLE IF NOT EXISTS risk_rules (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  rule_code       VARCHAR(50)         NOT NULL,
  rule_name       VARCHAR(100)        NOT NULL,
  rule_type       ENUM('large_amount','velocity','country','blacklist','device_risk','qr_abuse','failed_payments','manual_hold','auto_hold') NOT NULL,
  organization_id BIGINT UNSIGNED     NULL,
  merchant_id     BIGINT UNSIGNED     NULL,
  threshold_value DECIMAL(18, 4)      NULL,
  threshold_count INT UNSIGNED        NULL,
  country_code    CHAR(2)             NULL,
  action          ENUM('alert','hold','block','review') NOT NULL DEFAULT 'alert',
  priority        TINYINT UNSIGNED    NOT NULL DEFAULT 50,
  is_active       TINYINT(1)          NOT NULL DEFAULT 1,
  config_json     JSON                NULL,
  created_by      BIGINT UNSIGNED     NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_risk_rules_uuid (uuid),
  UNIQUE KEY uk_risk_rules_code (rule_code),
  KEY idx_risk_rules_type (rule_type),
  KEY idx_risk_rules_active (is_active),
  CONSTRAINT fk_rr_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_rr_merchant FOREIGN KEY (merchant_id) REFERENCES merchants (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_rr_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS risk_rule_evaluations (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  risk_rule_id    BIGINT UNSIGNED     NOT NULL,
  transaction_id  BIGINT UNSIGNED     NULL,
  merchant_id     BIGINT UNSIGNED     NULL,
  matched         TINYINT(1)          NOT NULL DEFAULT 0,
  action_taken    VARCHAR(50)         NULL,
  score           DECIMAL(5, 2)       NULL,
  details         JSON                NULL,
  evaluated_at    DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_rre_rule (risk_rule_id),
  KEY idx_rre_txn (transaction_id),
  KEY idx_rre_evaluated (evaluated_at DESC),
  CONSTRAINT fk_rre_rule FOREIGN KEY (risk_rule_id) REFERENCES risk_rules (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_rre_txn FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_rre_merchant FOREIGN KEY (merchant_id) REFERENCES merchants (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fraud foundation
CREATE TABLE IF NOT EXISTS fraud_cases (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  case_ref        VARCHAR(30)         NOT NULL,
  organization_id BIGINT UNSIGNED     NOT NULL,
  merchant_id     BIGINT UNSIGNED     NULL,
  transaction_id  BIGINT UNSIGNED     NULL,
  device_id       BIGINT UNSIGNED     NULL,
  fraud_score     DECIMAL(5, 2)       NOT NULL DEFAULT 0.00,
  status          ENUM('pending','under_review','approved','rejected','released') NOT NULL DEFAULT 'pending',
  source          VARCHAR(50)         NOT NULL DEFAULT 'risk_engine',
  title           VARCHAR(255)        NOT NULL,
  description     TEXT                NULL,
  reviewer_id     BIGINT UNSIGNED     NULL,
  reviewed_at     DATETIME            NULL,
  reviewer_remarks TEXT               NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_fraud_cases_uuid (uuid),
  UNIQUE KEY uk_fraud_cases_ref (case_ref),
  KEY idx_fraud_cases_status (status),
  KEY idx_fraud_cases_merchant (merchant_id),
  KEY idx_fraud_cases_score (fraud_score DESC),
  CONSTRAINT fk_fc_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_fc_merchant FOREIGN KEY (merchant_id) REFERENCES merchants (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_fc_txn FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_fc_device FOREIGN KEY (device_id) REFERENCES payment_devices (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_fc_reviewer FOREIGN KEY (reviewer_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Accounting foundation
CREATE TABLE IF NOT EXISTS ledger_accounts (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  account_code    VARCHAR(30)         NOT NULL,
  account_name    VARCHAR(100)        NOT NULL,
  account_type    ENUM('settlement','fees','refund','chargeback','reserve','revenue','expense') NOT NULL,
  organization_id BIGINT UNSIGNED     NULL,
  currency        CHAR(3)             NOT NULL DEFAULT 'USD',
  balance         DECIMAL(18, 2)      NOT NULL DEFAULT 0.00,
  is_active       TINYINT(1)          NOT NULL DEFAULT 1,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ledger_accounts_uuid (uuid),
  UNIQUE KEY uk_ledger_accounts_code (account_code),
  KEY idx_ledger_accounts_type (account_type),
  CONSTRAINT fk_la_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ledger_entries (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  entry_ref       VARCHAR(30)         NOT NULL,
  account_id      BIGINT UNSIGNED     NOT NULL,
  entry_type      ENUM('debit','credit') NOT NULL,
  amount          DECIMAL(18, 2)      NOT NULL,
  currency        CHAR(3)             NOT NULL DEFAULT 'USD',
  reference_type  VARCHAR(50)         NULL,
  reference_id    BIGINT UNSIGNED     NULL,
  description     VARCHAR(500)        NULL,
  posted_at       DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by      BIGINT UNSIGNED     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ledger_entries_uuid (uuid),
  UNIQUE KEY uk_ledger_entries_ref (entry_ref),
  KEY idx_ledger_entries_account (account_id, posted_at DESC),
  KEY idx_ledger_entries_reference (reference_type, reference_id),
  CONSTRAINT fk_le_account FOREIGN KEY (account_id) REFERENCES ledger_accounts (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_le_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE merchant_payment_method_config
  ADD CONSTRAINT fk_mpmc_risk_rule FOREIGN KEY (risk_rule_set_id) REFERENCES risk_rules (id) ON DELETE SET NULL ON UPDATE CASCADE;
