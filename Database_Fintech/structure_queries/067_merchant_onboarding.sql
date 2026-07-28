-- =============================================================================
-- 067_merchant_onboarding.sql
-- Enterprise merchant onboarding workflow tables
-- =============================================================================

CREATE TABLE IF NOT EXISTS merchant_onboarding_applications (
  id                    BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                  CHAR(36)            NOT NULL,
  application_ref       VARCHAR(30)         NOT NULL,
  organization_id       BIGINT UNSIGNED     NOT NULL,
  merchant_id           BIGINT UNSIGNED     NULL,
  onboarding_status     ENUM(
                          'draft', 'submitted', 'kyc_pending', 'under_review',
                          'approved', 'rejected', 'go_live', 'suspended', 'inactive'
                        )                   NOT NULL DEFAULT 'draft',
  current_step          TINYINT UNSIGNED    NOT NULL DEFAULT 1,
  rejection_reason      TEXT                NULL,
  submitted_at          DATETIME            NULL,
  approved_at           DATETIME            NULL,
  rejected_at           DATETIME            NULL,
  go_live_at            DATETIME            NULL,
  created_by            BIGINT UNSIGNED     NULL,
  updated_by            BIGINT UNSIGNED     NULL,
  created_at            DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at            DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_moa_uuid (uuid),
  UNIQUE KEY uk_moa_ref (application_ref),
  KEY idx_moa_org (organization_id),
  KEY idx_moa_status (onboarding_status),
  KEY idx_moa_merchant (merchant_id),
  KEY idx_moa_created_at (created_at),
  CONSTRAINT fk_moa_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_moa_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_moa_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_moa_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS merchant_onboarding_business (
  id                    BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  application_id        BIGINT UNSIGNED     NOT NULL,
  business_name         VARCHAR(255)        NOT NULL,
  legal_name            VARCHAR(255)        NOT NULL,
  merchant_category     VARCHAR(100)        NULL,
  industry              VARCHAR(100)        NULL,
  website               VARCHAR(255)        NULL,
  email                 VARCHAR(255)        NOT NULL,
  phone                 VARCHAR(30)         NULL,
  gst_number            VARCHAR(20)         NULL,
  pan_number            VARCHAR(15)         NULL,
  cin_number            VARCHAR(25)         NULL,
  business_type         ENUM('saas', 'retail', 'services', 'logistics', 'fintech', 'healthcare', 'other') NULL,
  created_at            DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_mob_application (application_id),
  CONSTRAINT fk_mob_application
    FOREIGN KEY (application_id) REFERENCES merchant_onboarding_applications (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS merchant_onboarding_addresses (
  id                    BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                  CHAR(36)            NOT NULL,
  application_id        BIGINT UNSIGNED     NOT NULL,
  address_type          ENUM('registered', 'operating') NOT NULL,
  line1                 VARCHAR(255)        NOT NULL,
  line2                 VARCHAR(255)        NULL,
  country               VARCHAR(100)        NOT NULL DEFAULT 'India',
  state                 VARCHAR(100)        NULL,
  city                  VARCHAR(100)        NOT NULL,
  pincode               VARCHAR(20)         NULL,
  latitude              DECIMAL(10, 7)      NULL,
  longitude             DECIMAL(10, 7)      NULL,
  created_at            DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_moa_addr_uuid (uuid),
  UNIQUE KEY uk_moa_addr_type (application_id, address_type),
  CONSTRAINT fk_moa_addr_application
    FOREIGN KEY (application_id) REFERENCES merchant_onboarding_applications (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS merchant_onboarding_kyc_documents (
  id                    BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                  CHAR(36)            NOT NULL,
  application_id        BIGINT UNSIGNED     NOT NULL,
  document_type         ENUM('pan', 'gst_certificate', 'cancelled_cheque', 'address_proof', 'owner_id') NOT NULL,
  file_name             VARCHAR(255)        NOT NULL,
  file_size             INT UNSIGNED        NULL,
  mime_type             VARCHAR(100)        NULL,
  storage_path          VARCHAR(500)        NULL,
  uploaded_by           BIGINT UNSIGNED     NULL,
  created_at            DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_mokd_uuid (uuid),
  UNIQUE KEY uk_mokd_app_type (application_id, document_type),
  CONSTRAINT fk_mokd_application
    FOREIGN KEY (application_id) REFERENCES merchant_onboarding_applications (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_mokd_uploaded_by
    FOREIGN KEY (uploaded_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS merchant_onboarding_bank_details (
  id                    BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  application_id        BIGINT UNSIGNED     NOT NULL,
  account_holder        VARCHAR(255)        NOT NULL,
  account_number_masked VARCHAR(30)         NOT NULL,
  ifsc                  VARCHAR(15)         NOT NULL,
  bank_name             VARCHAR(255)        NOT NULL,
  branch                VARCHAR(255)        NULL,
  account_type          ENUM('savings', 'current') NOT NULL DEFAULT 'current',
  verification_status   ENUM('pending', 'verified', 'failed') NOT NULL DEFAULT 'pending',
  created_at            DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_mobd_application (application_id),
  CONSTRAINT fk_mobd_application
    FOREIGN KEY (application_id) REFERENCES merchant_onboarding_applications (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS merchant_onboarding_settlement_config (
  id                    BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  application_id        BIGINT UNSIGNED     NOT NULL,
  settlement_cycle      ENUM('t0', 't1', 't2', 'weekly', 'monthly') NOT NULL DEFAULT 't1',
  settlement_currency   CHAR(3)             NOT NULL DEFAULT 'INR',
  settlement_method     ENUM('bank_transfer', 'neft', 'rtgs', 'imps') NOT NULL DEFAULT 'bank_transfer',
  min_settlement_amount DECIMAL(18, 2)      NOT NULL DEFAULT 1000.00,
  reserve_pct           DECIMAL(5, 2)       NOT NULL DEFAULT 0.00,
  rolling_reserve_pct   DECIMAL(5, 2)       NOT NULL DEFAULT 0.00,
  created_at            DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_mosc_application (application_id),
  CONSTRAINT fk_mosc_application
    FOREIGN KEY (application_id) REFERENCES merchant_onboarding_applications (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS merchant_onboarding_payment_config (
  id                    BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  application_id        BIGINT UNSIGNED     NOT NULL,
  enable_cards          TINYINT(1)          NOT NULL DEFAULT 1,
  enable_upi            TINYINT(1)          NOT NULL DEFAULT 1,
  enable_net_banking    TINYINT(1)          NOT NULL DEFAULT 0,
  enable_wallet         TINYINT(1)          NOT NULL DEFAULT 0,
  enable_emi            TINYINT(1)          NOT NULL DEFAULT 0,
  enable_bnpl           TINYINT(1)          NOT NULL DEFAULT 0,
  enable_qr             TINYINT(1)          NOT NULL DEFAULT 0,
  enable_payment_links  TINYINT(1)          NOT NULL DEFAULT 0,
  enable_subscriptions  TINYINT(1)          NOT NULL DEFAULT 0,
  created_at            DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_mopc_application (application_id),
  CONSTRAINT fk_mopc_application
    FOREIGN KEY (application_id) REFERENCES merchant_onboarding_applications (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS merchant_onboarding_timeline_events (
  id                    BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                  CHAR(36)            NOT NULL,
  application_id        BIGINT UNSIGNED     NOT NULL,
  event_type            ENUM('created', 'updated', 'submitted', 'kyc_pending', 'under_review', 'approved', 'rejected', 'go_live', 'suspended', 'inactive') NOT NULL,
  summary               VARCHAR(500)        NOT NULL,
  actor_user_id         BIGINT UNSIGNED     NULL,
  metadata              JSON                NULL,
  created_at            DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_mote_uuid (uuid),
  KEY idx_mote_application (application_id),
  KEY idx_mote_event_type (event_type),
  KEY idx_mote_created_at (created_at),
  CONSTRAINT fk_mote_application
    FOREIGN KEY (application_id) REFERENCES merchant_onboarding_applications (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_mote_actor
    FOREIGN KEY (actor_user_id) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
