-- =============================================================================
-- 066_enterprise_stabilization.sql
-- Merchants org FK, export registry, audit org column
-- =============================================================================

USE fintech_db;

ALTER TABLE merchants
  ADD COLUMN organization_id BIGINT UNSIGNED NULL AFTER uuid,
  ADD KEY idx_merchants_organization (organization_id);

-- Merchants org backfill + NOT NULL FK: 066b_merchants_org_finalize.sql (after demo seed)

ALTER TABLE audit_logs
  ADD COLUMN organization_id BIGINT UNSIGNED NULL AFTER user_id,
  ADD KEY idx_audit_logs_organization (organization_id),
  ADD CONSTRAINT fk_audit_logs_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS export_file_registry (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  file_id         VARCHAR(64)         NOT NULL,
  user_id         BIGINT UNSIGNED     NOT NULL,
  organization_id BIGINT UNSIGNED     NULL,
  permission_code VARCHAR(64)         NOT NULL,
  created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_export_file_registry_file (file_id),
  KEY idx_export_file_registry_user (user_id),
  CONSTRAINT fk_export_file_registry_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_export_file_registry_org
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
