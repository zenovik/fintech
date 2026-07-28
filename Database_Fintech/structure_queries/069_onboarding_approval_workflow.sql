-- =============================================================================
-- 069_onboarding_approval_workflow.sql
-- Configurable approval workflow, compliance queue, risk review, KYC verification, tax profiles, SLA
-- =============================================================================

ALTER TABLE merchant_onboarding_applications
  MODIFY onboarding_status ENUM(
    'draft', 'submitted', 'compliance_review', 'risk_review', 'business_review',
    'kyc_pending', 'under_review', 'approved', 'rejected', 'sent_back',
    'go_live', 'completed', 'suspended', 'inactive'
  ) NOT NULL DEFAULT 'draft';

ALTER TABLE merchant_onboarding_timeline_events
  MODIFY event_type ENUM(
    'created', 'updated', 'submitted', 'assigned', 'compliance_review', 'risk_review',
    'business_review', 'kyc_pending', 'under_review', 'approved', 'rejected', 'sent_back',
    'go_live', 'activated', 'suspended', 'inactive', 'document_verified', 'risk_decision', 'sla_warning'
  ) NOT NULL;

CREATE TABLE IF NOT EXISTS onboarding_workflow_stage_definitions (
  id              TINYINT UNSIGNED    NOT NULL AUTO_INCREMENT,
  code            VARCHAR(40)         NOT NULL,
  name            VARCHAR(100)        NOT NULL,
  sequence_order  TINYINT UNSIGNED    NOT NULL,
  sla_hours       SMALLINT UNSIGNED   NOT NULL DEFAULT 48,
  required_role   VARCHAR(50)         NULL,
  is_skippable    TINYINT(1)          NOT NULL DEFAULT 0,
  is_terminal     TINYINT(1)          NOT NULL DEFAULT 0,
  maps_to_status  VARCHAR(40)         NOT NULL,
  is_active       TINYINT(1)          NOT NULL DEFAULT 1,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_owsd_code (code),
  KEY idx_owsd_sequence (sequence_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS onboarding_workflow_instances (
  id                    BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                  CHAR(36)            NOT NULL,
  application_id        BIGINT UNSIGNED     NOT NULL,
  current_stage_id      TINYINT UNSIGNED    NOT NULL,
  previous_stage_id     TINYINT UNSIGNED    NULL,
  assigned_user_id      BIGINT UNSIGNED     NULL,
  assigned_role_code    VARCHAR(50)         NULL,
  priority              ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
  workflow_status       ENUM('pending','in_progress','overdue','escalated','completed','rejected','sent_back') NOT NULL DEFAULT 'pending',
  sla_due_at            DATETIME            NULL,
  sla_breached          TINYINT(1)          NOT NULL DEFAULT 0,
  remarks               TEXT                NULL,
  started_at            DATETIME            NULL,
  completed_at          DATETIME            NULL,
  created_at            DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_owi_uuid (uuid),
  UNIQUE KEY uk_owi_application (application_id),
  KEY idx_owi_stage (current_stage_id),
  KEY idx_owi_assigned (assigned_user_id),
  KEY idx_owi_status (workflow_status),
  KEY idx_owi_sla (sla_due_at, sla_breached),
  CONSTRAINT fk_owi_application
    FOREIGN KEY (application_id) REFERENCES merchant_onboarding_applications (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_owi_stage
    FOREIGN KEY (current_stage_id) REFERENCES onboarding_workflow_stage_definitions (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_owi_prev_stage
    FOREIGN KEY (previous_stage_id) REFERENCES onboarding_workflow_stage_definitions (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_owi_assigned_user
    FOREIGN KEY (assigned_user_id) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS onboarding_workflow_stage_history (
  id                    BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                  CHAR(36)            NOT NULL,
  application_id        BIGINT UNSIGNED     NOT NULL,
  workflow_instance_id  BIGINT UNSIGNED     NOT NULL,
  stage_id              TINYINT UNSIGNED    NOT NULL,
  previous_stage_id     TINYINT UNSIGNED    NULL,
  next_stage_id         TINYINT UNSIGNED    NULL,
  decision              ENUM('submitted','assigned','approve','reject','send_back','reassign','skip','go_live','activated') NOT NULL,
  assigned_user_id      BIGINT UNSIGNED     NULL,
  assigned_role_code    VARCHAR(50)         NULL,
  decided_by            BIGINT UNSIGNED     NULL,
  remarks               TEXT                NULL,
  decided_at            DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_owsh_uuid (uuid),
  KEY idx_owsh_application (application_id),
  KEY idx_owsh_instance (workflow_instance_id),
  KEY idx_owsh_decided_at (decided_at),
  CONSTRAINT fk_owsh_application
    FOREIGN KEY (application_id) REFERENCES merchant_onboarding_applications (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_owsh_instance
    FOREIGN KEY (workflow_instance_id) REFERENCES onboarding_workflow_instances (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_owsh_stage
    FOREIGN KEY (stage_id) REFERENCES onboarding_workflow_stage_definitions (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_owsh_decided_by
    FOREIGN KEY (decided_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS onboarding_risk_reviews (
  id                          BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                        CHAR(36)            NOT NULL,
  application_id              BIGINT UNSIGNED     NOT NULL,
  business_category           VARCHAR(100)        NULL,
  country                     VARCHAR(100)        NULL,
  state                       VARCHAR(100)        NULL,
  kyc_score                   DECIMAL(5, 2)       NULL,
  document_verification_score DECIMAL(5, 2)       NULL,
  watchlist_match             TINYINT(1)          NOT NULL DEFAULT 0,
  blacklist_match             TINYINT(1)          NOT NULL DEFAULT 0,
  manual_risk_score           DECIMAL(5, 2)       NULL,
  final_risk_score            DECIMAL(5, 2)       NULL,
  risk_level                  ENUM('low','medium','high','critical') NOT NULL DEFAULT 'low',
  reviewer_remarks            TEXT                NULL,
  decision                    ENUM('pending','approved','rejected','escalated') NOT NULL DEFAULT 'pending',
  reviewer_id                 BIGINT UNSIGNED     NULL,
  reviewed_at                 DATETIME            NULL,
  created_at                  DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                  DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_orr_uuid (uuid),
  UNIQUE KEY uk_orr_application (application_id),
  KEY idx_orr_risk_level (risk_level),
  KEY idx_orr_decision (decision),
  CONSTRAINT fk_orr_application
    FOREIGN KEY (application_id) REFERENCES merchant_onboarding_applications (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_orr_reviewer
    FOREIGN KEY (reviewer_id) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE merchant_onboarding_kyc_documents
  ADD COLUMN verification_status ENUM('pending','approved','rejected','reupload_requested') NOT NULL DEFAULT 'pending' AFTER storage_path,
  ADD COLUMN version TINYINT UNSIGNED NOT NULL DEFAULT 1 AFTER verification_status,
  ADD COLUMN expires_at DATE NULL AFTER version,
  ADD COLUMN verified_by BIGINT UNSIGNED NULL AFTER expires_at,
  ADD COLUMN verified_at DATETIME NULL AFTER verified_by,
  ADD COLUMN verifier_remarks TEXT NULL AFTER verified_at,
  ADD KEY idx_mokd_verification (verification_status),
  ADD CONSTRAINT fk_mokd_verified_by FOREIGN KEY (verified_by) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS onboarding_kyc_verification_events (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)            NOT NULL,
  document_id     BIGINT UNSIGNED     NOT NULL,
  application_id  BIGINT UNSIGNED     NOT NULL,
  event_type      ENUM('uploaded','approved','rejected','reupload_requested','expired') NOT NULL,
  actor_user_id   BIGINT UNSIGNED     NULL,
  remarks         TEXT                NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_okve_uuid (uuid),
  KEY idx_okve_document (document_id),
  KEY idx_okve_application (application_id),
  CONSTRAINT fk_okve_document
    FOREIGN KEY (document_id) REFERENCES merchant_onboarding_kyc_documents (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_okve_application
    FOREIGN KEY (application_id) REFERENCES merchant_onboarding_applications (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_okve_actor
    FOREIGN KEY (actor_user_id) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS merchant_tax_profiles (
  id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                CHAR(36)            NOT NULL,
  application_id      BIGINT UNSIGNED     NULL,
  merchant_id         BIGINT UNSIGNED     NULL,
  legal_name          VARCHAR(255)        NOT NULL,
  trade_name          VARCHAR(255)        NULL,
  business_type       VARCHAR(50)         NULL,
  gst_number          VARCHAR(20)         NULL,
  pan_number          VARCHAR(15)         NULL,
  cin_number          VARCHAR(25)         NULL,
  msme_number         VARCHAR(30)         NULL,
  iec_number          VARCHAR(20)         NULL,
  tan_number          VARCHAR(15)         NULL,
  professional_tax    VARCHAR(30)         NULL,
  is_current          TINYINT(1)          NOT NULL DEFAULT 1,
  effective_from      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  effective_to        DATETIME            NULL,
  created_by          BIGINT UNSIGNED     NULL,
  created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_mtp_uuid (uuid),
  KEY idx_mtp_application (application_id),
  KEY idx_mtp_merchant (merchant_id),
  KEY idx_mtp_current (merchant_id, is_current),
  CONSTRAINT fk_mtp_application
    FOREIGN KEY (application_id) REFERENCES merchant_onboarding_applications (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_mtp_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_mtp_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
