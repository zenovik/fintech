-- =============================================================================
-- 066b_merchants_org_finalize.sql
-- Finalize merchants.organization_id after bulk demo seed load
-- =============================================================================

USE fintech_db;

UPDATE merchants SET organization_id = CASE
  WHEN id BETWEEN 1 AND 15 THEN 1
  WHEN id BETWEEN 16 AND 30 THEN 2
  WHEN id BETWEEN 31 AND 45 THEN 3
  WHEN id BETWEEN 46 AND 60 THEN 4
  WHEN id BETWEEN 61 AND 75 THEN 5
  WHEN id BETWEEN 76 AND 90 THEN 6
  WHEN id BETWEEN 91 AND 105 THEN 7
  ELSE 8
END WHERE organization_id IS NULL;

ALTER TABLE merchants
  MODIFY COLUMN organization_id BIGINT UNSIGNED NOT NULL,
  ADD CONSTRAINT fk_merchants_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
    ON DELETE RESTRICT ON UPDATE CASCADE;
