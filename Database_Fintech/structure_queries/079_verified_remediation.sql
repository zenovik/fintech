-- =============================================================================
-- 079_verified_remediation.sql
-- Additive FKs for email_delivery_log (audit-verified gap)
-- =============================================================================

ALTER TABLE email_delivery_log
  ADD CONSTRAINT fk_email_delivery_org
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_email_delivery_job
    FOREIGN KEY (job_id) REFERENCES background_jobs (id)
    ON DELETE SET NULL ON UPDATE CASCADE;
