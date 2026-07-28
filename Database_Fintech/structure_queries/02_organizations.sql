-- =============================================================================
-- 02_organizations.sql
-- Multi-tenant Organizations module — schema
-- =============================================================================

USE fintech_db;

-- ---------------------------------------------------------------------------
-- Organizations (tenant root)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid                CHAR(36)        NOT NULL,
  code                VARCHAR(64)     NOT NULL,
  legal_name          VARCHAR(255)    NOT NULL,
  display_name        VARCHAR(255)    NOT NULL,
  dba_name            VARCHAR(255)    NULL,
  tax_id              VARCHAR(64)     NULL,
  industry            VARCHAR(128)    NULL,
  website             VARCHAR(255)    NULL,
  status              ENUM('active','inactive','pending','archived') NOT NULL DEFAULT 'pending',
  logo_url            VARCHAR(512)    NULL,
  logo_initials       VARCHAR(8)      NULL,
  primary_color       VARCHAR(16)     NULL,
  base_currency       CHAR(3)         NOT NULL DEFAULT 'USD',
  timezone            VARCHAR(64)     NOT NULL DEFAULT 'UTC',
  locale              VARCHAR(16)     NOT NULL DEFAULT 'en-US',
  primary_region      VARCHAR(64)     NULL,
  description         TEXT            NULL,
  created_by          BIGINT UNSIGNED NULL,
  updated_by          BIGINT UNSIGNED NULL,
  archived_at         DATETIME(6)     NULL,
  created_at          DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at          DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_organizations_uuid (uuid),
  UNIQUE KEY uk_organizations_code (code),
  KEY idx_organizations_status (status),
  KEY idx_organizations_display (display_name),
  KEY idx_organizations_created (created_at),
  CONSTRAINT fk_organizations_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_organizations_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Addresses
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organization_addresses (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)        NOT NULL,
  organization_id BIGINT UNSIGNED NOT NULL,
  address_type    ENUM('registered','billing','shipping','other') NOT NULL DEFAULT 'registered',
  line1           VARCHAR(255)    NOT NULL,
  line2           VARCHAR(255)    NULL,
  city            VARCHAR(128)    NOT NULL,
  state_province  VARCHAR(128)    NULL,
  postal_code     VARCHAR(32)     NULL,
  country_code    CHAR(2)         NOT NULL DEFAULT 'US',
  is_primary      TINYINT(1)      NOT NULL DEFAULT 0,
  created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_org_addresses_uuid (uuid),
  KEY idx_org_addresses_org (organization_id),
  CONSTRAINT fk_org_addresses_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Contacts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organization_contacts (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)        NOT NULL,
  organization_id BIGINT UNSIGNED NOT NULL,
  contact_type    ENUM('primary','billing','support','technical') NOT NULL DEFAULT 'primary',
  first_name      VARCHAR(100)    NOT NULL,
  last_name       VARCHAR(100)    NOT NULL,
  email           VARCHAR(255)    NOT NULL,
  phone           VARCHAR(30)     NULL,
  job_title       VARCHAR(100)    NULL,
  is_primary      TINYINT(1)      NOT NULL DEFAULT 0,
  created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_org_contacts_uuid (uuid),
  KEY idx_org_contacts_org (organization_id),
  CONSTRAINT fk_org_contacts_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Domains
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organization_domains (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)        NOT NULL,
  organization_id BIGINT UNSIGNED NOT NULL,
  domain          VARCHAR(255)    NOT NULL,
  is_primary      TINYINT(1)      NOT NULL DEFAULT 0,
  is_verified     TINYINT(1)      NOT NULL DEFAULT 0,
  verification_token VARCHAR(128) NULL,
  verified_at     DATETIME(6)     NULL,
  status          ENUM('pending','verified','failed','removed') NOT NULL DEFAULT 'pending',
  created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_org_domains_uuid (uuid),
  UNIQUE KEY uk_org_domains_domain (domain),
  KEY idx_org_domains_org (organization_id),
  CONSTRAINT fk_org_domains_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Organization-scoped roles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organization_roles (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)        NOT NULL,
  organization_id BIGINT UNSIGNED NULL COMMENT 'NULL = global org role template',
  code            VARCHAR(64)     NOT NULL,
  name            VARCHAR(150)    NOT NULL,
  description     VARCHAR(255)    NULL,
  is_system       TINYINT(1)      NOT NULL DEFAULT 0,
  created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_org_roles_uuid (uuid),
  UNIQUE KEY uk_org_roles_org_code (organization_id, code),
  KEY idx_org_roles_org (organization_id),
  CONSTRAINT fk_org_roles_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Members
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organization_members (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)        NOT NULL,
  organization_id BIGINT UNSIGNED NOT NULL,
  user_id         BIGINT UNSIGNED NOT NULL,
  org_role_id     BIGINT UNSIGNED NOT NULL,
  status          ENUM('active','invited','suspended','removed') NOT NULL DEFAULT 'invited',
  is_default      TINYINT(1)      NOT NULL DEFAULT 0,
  invited_by      BIGINT UNSIGNED NULL,
  joined_at       DATETIME(6)     NULL,
  created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_org_members_uuid (uuid),
  UNIQUE KEY uk_org_members_org_user (organization_id, user_id),
  KEY idx_org_members_user (user_id),
  KEY idx_org_members_status (status),
  CONSTRAINT fk_org_members_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT fk_org_members_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_org_members_role FOREIGN KEY (org_role_id) REFERENCES organization_roles (id) ON DELETE RESTRICT,
  CONSTRAINT fk_org_members_invited_by FOREIGN KEY (invited_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Preferences (key/value per org)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organization_preferences (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)        NOT NULL,
  organization_id BIGINT UNSIGNED NOT NULL,
  pref_key        VARCHAR(128)    NOT NULL,
  pref_value      JSON            NULL,
  updated_by      BIGINT UNSIGNED NULL,
  created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_org_prefs_uuid (uuid),
  UNIQUE KEY uk_org_prefs_org_key (organization_id, pref_key),
  CONSTRAINT fk_org_prefs_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT fk_org_prefs_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Branding (1:1)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organization_branding (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)        NOT NULL,
  organization_id BIGINT UNSIGNED NOT NULL,
  company_name    VARCHAR(255)    NOT NULL,
  logo_url        VARCHAR(512)    NULL,
  logo_initials   VARCHAR(8)      NULL DEFAULT 'OR',
  primary_color   VARCHAR(16)     NOT NULL DEFAULT '#003ec7',
  secondary_color VARCHAR(16)     NOT NULL DEFAULT '#1e40af',
  accent_color    VARCHAR(16)     NOT NULL DEFAULT '#22c55e',
  favicon_url     VARCHAR(512)    NULL,
  updated_by      BIGINT UNSIGNED NULL,
  created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_org_branding_uuid (uuid),
  UNIQUE KEY uk_org_branding_org (organization_id),
  CONSTRAINT fk_org_branding_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT fk_org_branding_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- API Keys
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organization_api_keys (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid            CHAR(36)        NOT NULL,
  organization_id BIGINT UNSIGNED NOT NULL,
  name            VARCHAR(150)    NOT NULL,
  key_prefix      VARCHAR(32)     NOT NULL,
  key_hash        VARCHAR(128)    NOT NULL,
  environment     ENUM('live','test') NOT NULL DEFAULT 'test',
  status          ENUM('active','revoked','expired') NOT NULL DEFAULT 'active',
  last_used_at    DATETIME(6)     NULL,
  expires_at      DATETIME(6)     NULL,
  created_by      BIGINT UNSIGNED NULL,
  revoked_at      DATETIME(6)     NULL,
  created_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_org_api_keys_uuid (uuid),
  UNIQUE KEY uk_org_api_keys_hash (key_hash),
  KEY idx_org_api_keys_org (organization_id),
  KEY idx_org_api_keys_status (status),
  CONSTRAINT fk_org_api_keys_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT fk_org_api_keys_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Billing (1:1)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organization_billing (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  uuid                CHAR(36)        NOT NULL,
  organization_id     BIGINT UNSIGNED NOT NULL,
  plan_code           VARCHAR(64)     NOT NULL DEFAULT 'enterprise',
  plan_name           VARCHAR(150)    NOT NULL DEFAULT 'Enterprise',
  billing_email       VARCHAR(255)    NULL,
  billing_cycle       ENUM('monthly','yearly') NOT NULL DEFAULT 'monthly',
  status              ENUM('active','past_due','cancelled','trialing') NOT NULL DEFAULT 'active',
  currency            CHAR(3)         NOT NULL DEFAULT 'USD',
  amount              DECIMAL(14,2)   NOT NULL DEFAULT 0.00,
  next_billing_at     DATE            NULL,
  tax_exempt          TINYINT(1)      NOT NULL DEFAULT 0,
  payment_method_last4 VARCHAR(4)     NULL,
  payment_method_brand VARCHAR(32)    NULL,
  updated_by          BIGINT UNSIGNED NULL,
  created_at          DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at          DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_org_billing_uuid (uuid),
  UNIQUE KEY uk_org_billing_org (organization_id),
  CONSTRAINT fk_org_billing_org FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE,
  CONSTRAINT fk_org_billing_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
