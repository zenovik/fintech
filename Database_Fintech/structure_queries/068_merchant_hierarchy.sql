-- =============================================================================
-- 068_merchant_hierarchy.sql
-- Multi-outlet management, merchant users, outlet access, region & code config
-- =============================================================================

CREATE TABLE IF NOT EXISTS state_region_mapping (
  id              SMALLINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  state_name      VARCHAR(100)        NOT NULL,
  state_code      VARCHAR(10)         NULL,
  region_id       TINYINT UNSIGNED    NOT NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_state_region_state (state_name),
  KEY idx_state_region_region (region_id),
  CONSTRAINT fk_state_region_region
    FOREIGN KEY (region_id) REFERENCES regions (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS merchant_code_sequences (
  id                      TINYINT UNSIGNED    NOT NULL DEFAULT 1,
  prefix                  VARCHAR(20)         NOT NULL DEFAULT 'MCH',
  padding                 TINYINT UNSIGNED    NOT NULL DEFAULT 5,
  next_value              INT UNSIGNED        NOT NULL DEFAULT 1,
  legacy_random_enabled   TINYINT(1)          NOT NULL DEFAULT 0,
  updated_at              DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO merchant_code_sequences (id, prefix, padding, next_value, legacy_random_enabled)
VALUES (1, 'MCH', 5, 1, 0)
ON DUPLICATE KEY UPDATE prefix = VALUES(prefix);

CREATE TABLE IF NOT EXISTS merchant_roles (
  id              TINYINT UNSIGNED    NOT NULL AUTO_INCREMENT,
  code            VARCHAR(50)         NOT NULL,
  name            VARCHAR(100)        NOT NULL,
  description     VARCHAR(255)        NULL,
  is_active       TINYINT(1)          NOT NULL DEFAULT 1,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_merchant_roles_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS merchant_role_permissions (
  merchant_role_id    TINYINT UNSIGNED    NOT NULL,
  permission_id       BIGINT UNSIGNED     NOT NULL,
  granted_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (merchant_role_id, permission_id),
  KEY idx_mrp_permission (permission_id),
  CONSTRAINT fk_mrp_role
    FOREIGN KEY (merchant_role_id) REFERENCES merchant_roles (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_mrp_permission
    FOREIGN KEY (permission_id) REFERENCES permissions (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS merchant_outlets (
  id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                CHAR(36)            NOT NULL,
  outlet_code         VARCHAR(30)         NOT NULL,
  outlet_name         VARCHAR(255)        NOT NULL,
  merchant_id         BIGINT UNSIGNED     NOT NULL,
  organization_id     BIGINT UNSIGNED     NOT NULL,
  branch_type         ENUM('flagship','branch','warehouse','kiosk','popup','virtual') NOT NULL DEFAULT 'branch',
  store_number        VARCHAR(50)         NULL,
  gst_number          VARCHAR(20)         NULL,
  phone               VARCHAR(20)         NULL,
  email               VARCHAR(255)        NULL,
  status              ENUM('active','inactive','pending') NOT NULL DEFAULT 'active',
  opening_date        DATE                NULL,
  timezone            VARCHAR(64)         NOT NULL DEFAULT 'Asia/Kolkata',
  currency            CHAR(3)             NOT NULL DEFAULT 'INR',
  is_primary          TINYINT(1)          NOT NULL DEFAULT 0,
  latitude            DECIMAL(10, 7)      NULL,
  longitude           DECIMAL(10, 7)      NULL,
  working_hours       JSON                NULL,
  address_line1       VARCHAR(255)        NULL,
  address_line2       VARCHAR(255)        NULL,
  country             VARCHAR(100)        NOT NULL DEFAULT 'India',
  state               VARCHAR(100)        NULL,
  city                VARCHAR(100)        NULL,
  pincode             VARCHAR(20)         NULL,
  notes               TEXT                NULL,
  outlet_manager_id   BIGINT UNSIGNED     NULL,
  created_by          BIGINT UNSIGNED     NULL,
  updated_by          BIGINT UNSIGNED     NULL,
  created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at          DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_merchant_outlets_uuid (uuid),
  UNIQUE KEY uk_merchant_outlets_code (outlet_code),
  KEY idx_mo_merchant (merchant_id),
  KEY idx_mo_organization (organization_id),
  KEY idx_mo_status (status),
  KEY idx_mo_primary (merchant_id, is_primary),
  KEY idx_mo_city (city),
  KEY idx_mo_deleted (deleted_at),
  CONSTRAINT fk_mo_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_mo_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_mo_manager
    FOREIGN KEY (outlet_manager_id) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_mo_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_mo_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS merchant_users (
  id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  uuid                CHAR(36)            NOT NULL,
  user_id             BIGINT UNSIGNED     NOT NULL,
  organization_id     BIGINT UNSIGNED     NOT NULL,
  merchant_id         BIGINT UNSIGNED     NOT NULL,
  merchant_role_id    TINYINT UNSIGNED    NOT NULL,
  default_outlet_id   BIGINT UNSIGNED     NULL,
  access_scope        ENUM('single','multiple','all') NOT NULL DEFAULT 'all',
  status              ENUM('active','inactive','pending','invited') NOT NULL DEFAULT 'pending',
  invited_at          DATETIME            NULL,
  invited_by          BIGINT UNSIGNED     NULL,
  activated_at        DATETIME            NULL,
  created_by          BIGINT UNSIGNED     NULL,
  updated_by          BIGINT UNSIGNED     NULL,
  created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at          DATETIME            NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_merchant_users_uuid (uuid),
  UNIQUE KEY uk_merchant_users_user_merchant (user_id, merchant_id),
  KEY idx_mu_merchant (merchant_id),
  KEY idx_mu_organization (organization_id),
  KEY idx_mu_status (status),
  KEY idx_mu_role (merchant_role_id),
  KEY idx_mu_deleted (deleted_at),
  CONSTRAINT fk_mu_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_mu_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_mu_merchant
    FOREIGN KEY (merchant_id) REFERENCES merchants (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_mu_role
    FOREIGN KEY (merchant_role_id) REFERENCES merchant_roles (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_mu_default_outlet
    FOREIGN KEY (default_outlet_id) REFERENCES merchant_outlets (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_mu_invited_by
    FOREIGN KEY (invited_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_mu_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_mu_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS merchant_user_outlets (
  merchant_user_id    BIGINT UNSIGNED     NOT NULL,
  outlet_id           BIGINT UNSIGNED     NOT NULL,
  assigned_at         DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  assigned_by         BIGINT UNSIGNED     NULL,
  PRIMARY KEY (merchant_user_id, outlet_id),
  KEY idx_muo_outlet (outlet_id),
  CONSTRAINT fk_muo_merchant_user
    FOREIGN KEY (merchant_user_id) REFERENCES merchant_users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_muo_outlet
    FOREIGN KEY (outlet_id) REFERENCES merchant_outlets (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_muo_assigned_by
    FOREIGN KEY (assigned_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
