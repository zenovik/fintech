-- =============================================================================
-- 078_production_hardening.sql
-- Performance indexes, partition-ready columns, retention policies (additive)
-- =============================================================================

-- Partition-ready month bucket (YYYY-MM) for future RANGE partitioning
ALTER TABLE transactions
  ADD COLUMN partition_month CHAR(7) GENERATED ALWAYS AS (DATE_FORMAT(processed_at, '%Y-%m')) STORED,
  ADD KEY idx_transactions_partition_month (partition_month, processed_at);

ALTER TABLE payment_webhook_deliveries
  ADD COLUMN partition_month CHAR(7) GENERATED ALWAYS AS (DATE_FORMAT(created_at, '%Y-%m')) STORED,
  ADD KEY idx_pwd_partition_status_created (partition_month, status, created_at);

ALTER TABLE audit_logs
  ADD COLUMN partition_month CHAR(7) GENERATED ALWAYS AS (DATE_FORMAT(created_at, '%Y-%m')) STORED,
  ADD KEY idx_audit_logs_org_created (organization_id, created_at),
  ADD KEY idx_audit_logs_partition_created (partition_month, created_at);

ALTER TABLE api_usage_logs
  ADD COLUMN partition_month CHAR(7) GENERATED ALWAYS AS (DATE_FORMAT(created_at, '%Y-%m')) STORED,
  ADD KEY idx_api_usage_partition_org (partition_month, organization_id, created_at);

ALTER TABLE qr_scan_history
  ADD COLUMN partition_month CHAR(7) GENERATED ALWAYS AS (DATE_FORMAT(created_at, '%Y-%m')) STORED,
  ADD KEY idx_qr_scan_partition_merchant (partition_month, merchant_id, created_at);

ALTER TABLE notification_deliveries
  ADD KEY idx_notification_deliveries_status_created (status, created_at),
  ADD KEY idx_notification_deliveries_created (created_at);

ALTER TABLE email_delivery_log
  ADD KEY idx_email_delivery_org_created (organization_id, created_at);

ALTER TABLE background_jobs
  ADD KEY idx_background_jobs_status_created (status, created_at);

ALTER TABLE webhook_delivery_queue
  ADD KEY idx_wdq_partition_status (status, created_at);

-- Worker / queue throughput
ALTER TABLE retry_queue
  ADD KEY idx_retry_queue_status_scheduled (status, scheduled_at);

-- Retention policy registry (archive jobs read from here)
CREATE TABLE IF NOT EXISTS data_retention_policies (
  id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  table_name      VARCHAR(64)         NOT NULL,
  retention_days  INT UNSIGNED        NOT NULL DEFAULT 365,
  archive_enabled TINYINT(1)          NOT NULL DEFAULT 0,
  partition_key   VARCHAR(32)         NOT NULL DEFAULT 'partition_month',
  notes           VARCHAR(255)        NULL,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_retention_table (table_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO data_retention_policies (table_name, retention_days, archive_enabled, notes) VALUES
  ('transactions', 2555, 0, '7 years — financial records'),
  ('payment_webhook_deliveries', 90, 1, 'Archive after 90 days'),
  ('webhook_delivery_queue', 90, 1, 'Archive delivered/dead_letter after 90 days'),
  ('audit_logs', 730, 1, 'Archive after 2 years'),
  ('api_usage_logs', 180, 1, 'Archive after 6 months'),
  ('qr_scan_history', 365, 1, 'Archive after 1 year'),
  ('notification_deliveries', 180, 1, 'Archive after 6 months'),
  ('email_delivery_log', 365, 1, 'Archive after 1 year'),
  ('background_jobs', 90, 1, 'Purge completed/failed after 90 days');
