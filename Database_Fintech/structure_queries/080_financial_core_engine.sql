-- =============================================================================
-- 080_financial_core_engine.sql
-- Enterprise V2: double-entry ledger, event outbox, gateway abstraction,
-- settlement/payout scheduling, reconciliation matching
-- =============================================================================

-- Extend ledger account types for GL / AR / AP
ALTER TABLE ledger_accounts
  MODIFY account_type ENUM(
    'asset','liability','equity','revenue','expense',
    'settlement','fees','refund','chargeback','reserve',
    'accounts_receivable','accounts_payable','general_ledger'
  ) NOT NULL DEFAULT 'general_ledger',
  ADD COLUMN parent_account_id BIGINT UNSIGNED NULL AFTER organization_id,
  ADD COLUMN normal_balance ENUM('debit','credit') NOT NULL DEFAULT 'debit' AFTER currency,
  ADD KEY idx_ledger_accounts_parent (parent_account_id),
  ADD CONSTRAINT fk_la_parent FOREIGN KEY (parent_account_id) REFERENCES ledger_accounts (id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Immutable journal (source of truth for double-entry)
CREATE TABLE IF NOT EXISTS journal_entries (
  id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                CHAR(36)            NOT NULL,
  journal_ref         VARCHAR(40)         NOT NULL,
  organization_id     BIGINT UNSIGNED     NULL,
  status              ENUM('draft','posted','reversed') NOT NULL DEFAULT 'draft',
  version             INT UNSIGNED        NOT NULL DEFAULT 1,
  reversal_of_id      BIGINT UNSIGNED     NULL,
  reference_type      VARCHAR(50)         NULL,
  reference_id        BIGINT UNSIGNED     NULL,
  description         VARCHAR(500)        NULL,
  currency            CHAR(3)             NOT NULL DEFAULT 'USD',
  total_debit         DECIMAL(18, 2)      NOT NULL DEFAULT 0.00,
  total_credit        DECIMAL(18, 2)      NOT NULL DEFAULT 0.00,
  posted_at           DATETIME            NULL,
  created_by          BIGINT UNSIGNED     NULL,
  created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_journal_entries_uuid (uuid),
  UNIQUE KEY uk_journal_entries_ref (journal_ref),
  KEY idx_journal_entries_status (status, posted_at DESC),
  KEY idx_journal_entries_reference (reference_type, reference_id),
  KEY idx_journal_entries_org (organization_id),
  CONSTRAINT fk_je_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_je_reversal FOREIGN KEY (reversal_of_id) REFERENCES journal_entries (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_je_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS journal_lines (
  id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                CHAR(36)            NOT NULL,
  journal_entry_id    BIGINT UNSIGNED     NOT NULL,
  account_id          BIGINT UNSIGNED     NOT NULL,
  line_type           ENUM('debit','credit') NOT NULL,
  amount              DECIMAL(18, 2)      NOT NULL,
  currency            CHAR(3)             NOT NULL DEFAULT 'USD',
  description         VARCHAR(500)        NULL,
  line_number         SMALLINT UNSIGNED   NOT NULL DEFAULT 1,
  created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_journal_lines_uuid (uuid),
  KEY idx_journal_lines_entry (journal_entry_id),
  KEY idx_journal_lines_account (account_id),
  CONSTRAINT fk_jl_entry FOREIGN KEY (journal_entry_id) REFERENCES journal_entries (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_jl_account FOREIGN KEY (account_id) REFERENCES ledger_accounts (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS account_balances (
  account_id          BIGINT UNSIGNED     NOT NULL,
  balance             DECIMAL(18, 2)      NOT NULL DEFAULT 0.00,
  debit_total         DECIMAL(18, 2)      NOT NULL DEFAULT 0.00,
  credit_total        DECIMAL(18, 2)      NOT NULL DEFAULT 0.00,
  last_journal_entry_id BIGINT UNSIGNED   NULL,
  updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (account_id),
  CONSTRAINT fk_ab_account FOREIGN KEY (account_id) REFERENCES ledger_accounts (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ab_journal FOREIGN KEY (last_journal_entry_id) REFERENCES journal_entries (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Event outbox (Kafka/RabbitMQ ready)
CREATE TABLE IF NOT EXISTS event_outbox (
  id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                CHAR(36)            NOT NULL,
  event_type          VARCHAR(100)        NOT NULL,
  event_category      ENUM('domain','integration') NOT NULL DEFAULT 'domain',
  aggregate_type      VARCHAR(50)         NOT NULL,
  aggregate_id        VARCHAR(64)         NOT NULL,
  payload             JSON                NOT NULL,
  status              ENUM('pending','published','failed','dead_letter') NOT NULL DEFAULT 'pending',
  publish_attempts    TINYINT UNSIGNED    NOT NULL DEFAULT 0,
  max_attempts        TINYINT UNSIGNED    NOT NULL DEFAULT 5,
  published_at        DATETIME            NULL,
  next_retry_at       DATETIME            NULL,
  error_message       VARCHAR(1000)       NULL,
  correlation_id      VARCHAR(64)         NULL,
  organization_id     BIGINT UNSIGNED     NULL,
  created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_event_outbox_uuid (uuid),
  KEY idx_event_outbox_pending (status, next_retry_at, created_at),
  KEY idx_event_outbox_aggregate (aggregate_type, aggregate_id),
  CONSTRAINT fk_eo_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS dead_letter_events (
  id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  outbox_id           BIGINT UNSIGNED     NULL,
  event_type          VARCHAR(100)        NOT NULL,
  payload             JSON                NOT NULL,
  error_message       VARCHAR(2000)       NULL,
  replay_count        TINYINT UNSIGNED    NOT NULL DEFAULT 0,
  status              ENUM('open','replayed','discarded') NOT NULL DEFAULT 'open',
  created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  replayed_at         DATETIME            NULL,
  PRIMARY KEY (id),
  KEY idx_dle_status (status, created_at DESC),
  CONSTRAINT fk_dle_outbox FOREIGN KEY (outbox_id) REFERENCES event_outbox (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment gateway abstraction
CREATE TABLE IF NOT EXISTS payment_gateway_providers (
  id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  code                VARCHAR(30)         NOT NULL,
  name                VARCHAR(100)        NOT NULL,
  is_active           TINYINT(1)          NOT NULL DEFAULT 1,
  supports_authorize  TINYINT(1)          NOT NULL DEFAULT 1,
  supports_capture    TINYINT(1)          NOT NULL DEFAULT 1,
  supports_refund     TINYINT(1)          NOT NULL DEFAULT 1,
  supports_void       TINYINT(1)          NOT NULL DEFAULT 1,
  supports_tokenize   TINYINT(1)          NOT NULL DEFAULT 0,
  config_schema       JSON                NULL,
  created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_pgp_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_gateway_transactions (
  id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                CHAR(36)            NOT NULL,
  provider_id         BIGINT UNSIGNED     NOT NULL,
  payment_intent_id   BIGINT UNSIGNED     NULL,
  organization_id     BIGINT UNSIGNED     NULL,
  merchant_id         BIGINT UNSIGNED     NULL,
  operation           ENUM('authorize','capture','refund','void','tokenize') NOT NULL,
  external_id         VARCHAR(128)        NULL,
  status              ENUM('pending','succeeded','failed') NOT NULL DEFAULT 'pending',
  amount              DECIMAL(18, 2)      NULL,
  currency            CHAR(3)             NULL,
  request_payload     JSON                NULL,
  response_payload    JSON                NULL,
  error_message       VARCHAR(1000)       NULL,
  webhook_verified    TINYINT(1)          NOT NULL DEFAULT 0,
  created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at        DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_pgt_uuid (uuid),
  KEY idx_pgt_intent (payment_intent_id),
  KEY idx_pgt_external (provider_id, external_id),
  CONSTRAINT fk_pgt_provider FOREIGN KEY (provider_id) REFERENCES payment_gateway_providers (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_pgt_intent FOREIGN KEY (payment_intent_id) REFERENCES payment_intents (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_pgt_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_pgt_merchant FOREIGN KEY (merchant_id) REFERENCES merchants (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Settlement scheduling
CREATE TABLE IF NOT EXISTS settlement_schedules (
  id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                CHAR(36)            NOT NULL,
  merchant_id         BIGINT UNSIGNED     NOT NULL,
  organization_id     BIGINT UNSIGNED     NOT NULL,
  schedule_type       ENUM('daily','weekly','manual','instant') NOT NULL DEFAULT 'daily',
  cron_expression     VARCHAR(50)         NULL,
  next_run_at         DATETIME            NULL,
  last_run_at         DATETIME            NULL,
  is_active           TINYINT(1)          NOT NULL DEFAULT 1,
  created_by          BIGINT UNSIGNED     NULL,
  created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_settlement_schedules_uuid (uuid),
  KEY idx_settlement_schedules_next (is_active, next_run_at),
  CONSTRAINT fk_ss_merchant FOREIGN KEY (merchant_id) REFERENCES merchants (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ss_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_ss_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settlement_run_logs (
  id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  schedule_id         BIGINT UNSIGNED     NULL,
  merchant_id         BIGINT UNSIGNED     NOT NULL,
  settlement_id       BIGINT UNSIGNED     NULL,
  run_type            ENUM('scheduled','manual','retry') NOT NULL DEFAULT 'scheduled',
  status              ENUM('pending','completed','partial','failed') NOT NULL DEFAULT 'pending',
  amount_settled      DECIMAL(18, 2)      NOT NULL DEFAULT 0.00,
  transaction_count   INT UNSIGNED        NOT NULL DEFAULT 0,
  error_message       VARCHAR(1000)       NULL,
  started_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at        DATETIME            NULL,
  PRIMARY KEY (id),
  KEY idx_srl_merchant (merchant_id, started_at DESC),
  KEY idx_srl_schedule (schedule_id),
  CONSTRAINT fk_srl_schedule FOREIGN KEY (schedule_id) REFERENCES settlement_schedules (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_srl_merchant FOREIGN KEY (merchant_id) REFERENCES merchants (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_srl_settlement FOREIGN KEY (settlement_id) REFERENCES settlements (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reconciliation auto-match
CREATE TABLE IF NOT EXISTS reconciliation_matches (
  id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                CHAR(36)            NOT NULL,
  record_id           BIGINT UNSIGNED     NOT NULL,
  match_type          ENUM('automatic','manual') NOT NULL DEFAULT 'automatic',
  matched_entity_type ENUM('transaction','settlement','payout','gateway') NOT NULL,
  matched_entity_id   BIGINT UNSIGNED     NOT NULL,
  difference_amount   DECIMAL(18, 2)      NOT NULL DEFAULT 0.00,
  status              ENUM('matched','exception','adjusted') NOT NULL DEFAULT 'matched',
  matched_by          BIGINT UNSIGNED     NULL,
  matched_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes               VARCHAR(500)        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_reconciliation_matches_uuid (uuid),
  KEY idx_rm_record (record_id),
  CONSTRAINT fk_rm_record FOREIGN KEY (record_id) REFERENCES reconciliation_records (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_rm_matched_by FOREIGN KEY (matched_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Month close / accounting periods
CREATE TABLE IF NOT EXISTS accounting_periods (
  id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  organization_id     BIGINT UNSIGNED     NOT NULL,
  period_year         SMALLINT UNSIGNED   NOT NULL,
  period_month        TINYINT UNSIGNED    NOT NULL,
  status              ENUM('open','closing','closed') NOT NULL DEFAULT 'open',
  closed_at           DATETIME            NULL,
  closed_by           BIGINT UNSIGNED     NULL,
  created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_accounting_periods (organization_id, period_year, period_month),
  CONSTRAINT fk_ap_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ap_closed_by FOREIGN KEY (closed_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GL chart of accounts for double-entry posting
INSERT INTO ledger_accounts (uuid, account_code, account_name, account_type, normal_balance, currency) VALUES
('la080001-0000-4000-8000-000000000001', '1000-CASH',   'Cash & Bank',           'asset',              'debit',  'USD'),
('la080002-0000-4000-8000-000000000002', '2000-SETTLE', 'Settlement Payable',    'settlement',         'credit', 'USD'),
('la080003-0000-4000-8000-000000000003', '4000-REV',    'Merchant Revenue',      'revenue',            'credit', 'USD'),
('la080004-0000-4000-8000-000000000004', '5000-FEES',   'Processing Fees',       'fees',               'credit', 'USD'),
('la080005-0000-4000-8000-000000000005', '1100-AR',     'Accounts Receivable',   'accounts_receivable','debit',  'USD'),
('la080006-0000-4000-8000-000000000006', '2100-AP',     'Accounts Payable',      'accounts_payable',   'credit', 'USD')
ON DUPLICATE KEY UPDATE account_name = VALUES(account_name);

INSERT INTO payment_gateway_providers (code, name, supports_tokenize) VALUES
('internal', 'Internal Simulator', 1),
('stripe', 'Stripe', 1),
('razorpay', 'Razorpay', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Financial core permissions
INSERT INTO permissions (id, uuid, code, name, module, description) VALUES
(200, 'p2000000-0000-4000-8000-000000000200', 'accounting:write',     'Post Accounting',     'accounting', 'Post journals and adjustments'),
(201, 'p2000001-0000-4000-8000-000000000201', 'ledger:post',          'Ledger Post',         'accounting', 'Execute ledger posting engine'),
(202, 'p2000002-0000-4000-8000-000000000202', 'ledger:reverse',       'Ledger Reverse',      'accounting', 'Reverse posted journals'),
(203, 'p2000003-0000-4000-8000-000000000203', 'gateway:read',         'View Gateways',       'payments',   'View payment gateway transactions'),
(204, 'p2000004-0000-4000-8000-000000000204', 'gateway:manage',       'Manage Gateways',     'payments',   'Configure payment gateways'),
(205, 'p2000005-0000-4000-8000-000000000205', 'events:read',          'View Events',         'system',     'View domain and integration events'),
(206, 'p2000006-0000-4000-8000-000000000206', 'events:replay',        'Replay Events',       'system',     'Replay dead-letter events')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, p.id FROM permissions p WHERE p.code IN (
  'accounting:write','ledger:post','ledger:reverse','gateway:read','gateway:manage','events:read','events:replay'
)
ON DUPLICATE KEY UPDATE role_id = role_id;

-- Default settlement schedule job seed
INSERT INTO background_job_schedules (uuid, job_type, cron_expression, payload, is_active)
SELECT UUID(), 'settlement_batch', '0 2 * * *', JSON_OBJECT('mode','daily'), 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM background_job_schedules WHERE job_type = 'settlement_batch' LIMIT 1);

INSERT INTO background_job_schedules (uuid, job_type, cron_expression, payload, is_active)
SELECT UUID(), 'payout_batch', '0 4 * * *', JSON_OBJECT('mode','scheduled'), 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM background_job_schedules WHERE job_type = 'payout_batch' LIMIT 1);

INSERT INTO background_job_schedules (uuid, job_type, cron_expression, payload, is_active)
SELECT UUID(), 'outbox_publish', '*/1 * * * *', JSON_OBJECT('batchSize', 50), 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM background_job_schedules WHERE job_type = 'outbox_publish' LIMIT 1);
