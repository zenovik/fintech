-- =============================================================================
-- 56_dummy_data_enterprise_platform.sql
-- Permissions 133+, enterprise platform demo seed procedures
-- =============================================================================

INSERT INTO permissions (id, uuid, code, name, module, description) VALUES
(133, 'p1000133-0000-4000-8000-000000000133', 'developer:read',        'View Developer Portal',    'developer',       'View API keys, OAuth apps, usage'),
(134, 'p1000134-0000-4000-8000-000000000134', 'developer:write',       'Manage Developer Portal',  'developer',       'Create and rotate API keys'),
(135, 'p1000135-0000-4000-8000-000000000135', 'developer:manage',      'Admin Developer Portal',   'developer',       'Full developer platform admin'),
(136, 'p1000136-0000-4000-8000-000000000136', 'webhooks:read',         'View Webhooks',            'webhooks',        'View webhook endpoints and deliveries'),
(137, 'p1000137-0000-4000-8000-000000000137', 'webhooks:write',        'Manage Webhooks',          'webhooks',        'Configure webhooks and subscriptions'),
(138, 'p1000138-0000-4000-8000-000000000138', 'webhooks:manage',       'Admin Webhooks',           'webhooks',        'Replay, simulate, and manage webhooks'),
(139, 'p1000139-0000-4000-8000-000000000139', 'reconciliation:read',   'View Reconciliation',      'reconciliation',  'View reconciliation imports and records'),
(140, 'p1000140-0000-4000-8000-000000000140', 'reconciliation:write',  'Manage Reconciliation',    'reconciliation',  'Import and match reconciliation records'),
(141, 'p1000141-0000-4000-8000-000000000141', 'reconciliation:manage', 'Admin Reconciliation',     'reconciliation',  'Resolve exceptions and unmatched items'),
(142, 'p1000142-0000-4000-8000-000000000142', 'sandbox:read',          'View Sandbox',             'sandbox',         'View sandbox accounts and test data'),
(143, 'p1000143-0000-4000-8000-000000000143', 'sandbox:write',         'Manage Sandbox',           'sandbox',         'Create sandbox accounts and simulations'),
(144, 'p1000144-0000-4000-8000-000000000144', 'sandbox:manage',        'Admin Sandbox',            'sandbox',         'Full sandbox administration'),
(145, 'p1000145-0000-4000-8000-000000000145', 'ai_insights:read',      'AI Insights',              'ai',              'View AI forecasts and insights'),
(146, 'p1000146-0000-4000-8000-000000000146', 'production:read',       'View Production Platform', 'production',      'View cache, backup, metrics'),
(147, 'p1000147-0000-4000-8000-000000000147', 'production:manage',     'Manage Production Platform','production',     'Configure cache, backup, DR')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO role_permissions (role_id, permission_id) VALUES
(1, 133), (1, 134), (1, 135), (1, 136), (1, 137), (1, 138), (1, 139), (1, 140), (1, 141),
(1, 142), (1, 143), (1, 144), (1, 145), (1, 146), (1, 147),
(2, 133), (2, 136), (2, 139), (2, 142), (2, 145),
(5, 133), (5, 136), (5, 139), (5, 142)
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

INSERT INTO sandbox_test_cards (uuid, card_number, brand, scenario, description) VALUES
('stc00001-0000-4000-8000-000000000001', '4111111111111111', 'visa',       'success',              'Visa success'),
('stc00002-0000-4000-8000-000000000002', '4000000000000002', 'visa',       'decline',              'Visa decline'),
('stc00003-0000-4000-8000-000000000003', '4000000000009995', 'visa',       'insufficient_funds',   'Insufficient funds'),
('stc00004-0000-4000-8000-000000000004', '5105105105105100', 'mastercard', 'success',              'Mastercard success'),
('stc00005-0000-4000-8000-000000000005', '378282246310005',  'amex',       'fraud',                'Fraud block'),
('stc00006-0000-4000-8000-000000000006', '4242424242424242', 'visa',       'timeout',              'Gateway timeout')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO cache_configurations (uuid, cache_key, provider, ttl_seconds, is_enabled) VALUES
('cc000001-0000-4000-8000-000000000001', 'session',       'memory', 3600,  1),
('cc000002-0000-4000-8000-000000000002', 'api_rate',      'redis',  60,    1),
('cc000003-0000-4000-8000-000000000003', 'merchant_meta', 'redis',  900,   1)
ON DUPLICATE KEY UPDATE ttl_seconds = VALUES(ttl_seconds);

INSERT INTO backup_configurations (uuid, backup_type, schedule_cron, retention_days, destination, is_enabled) VALUES
('bc000001-0000-4000-8000-000000000001', 'database', '0 2 * * *',  30, 's3://backups/db',  1),
('bc000002-0000-4000-8000-000000000002', 'files',    '0 3 * * 0',  14, 's3://backups/files', 1),
('bc000003-0000-4000-8000-000000000003', 'full',     '0 1 1 * *',  90, 's3://backups/full',  1)
ON DUPLICATE KEY UPDATE schedule_cron = VALUES(schedule_cron);

INSERT INTO audit_actions (uuid, code, name, category_code, description, risk_level) VALUES
('aa000100-0000-4000-8000-000000000100', 'api_key_rotated',     'API Key Rotated',      'developer',       'API key secret rotated', 'medium'),
('aa000101-0000-4000-8000-000000000101', 'webhook_replayed',    'Webhook Replayed',     'webhooks',        'Webhook delivery replayed', 'low'),
('aa000102-0000-4000-8000-000000000102', 'recon_imported',      'Reconciliation Import','reconciliation',  'Bank file imported', 'low'),
('aa000103-0000-4000-8000-000000000103', 'sandbox_created',     'Sandbox Created',      'sandbox',         'Sandbox account provisioned', 'low')
ON DUPLICATE KEY UPDATE name = VALUES(name);

DROP PROCEDURE IF EXISTS sp_seed_enterprise_platform_demo;
DELIMITER //
CREATE PROCEDURE sp_seed_enterprise_platform_demo()
BEGIN
  DECLARE i INT DEFAULT 1;
  DECLARE m_id BIGINT;
  DECLARE org_id BIGINT;
  DECLARE cust_id BIGINT;
  DECLARE plan_id BIGINT;
  DECLARE wh_id BIGINT;
  DECLARE imp_id BIGINT;
  DECLARE sub_id BIGINT;
  DECLARE inv_id BIGINT;
  DECLARE batch INT DEFAULT 5000;
  DECLARE row_offset INT DEFAULT 0;

  SELECT id, organization_id INTO m_id, org_id FROM merchants WHERE deleted_at IS NULL ORDER BY id LIMIT 1;
  IF m_id IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No merchant for platform demo'; END IF;
  SELECT id INTO cust_id FROM customers WHERE merchant_id = m_id LIMIT 1;
  SELECT id INTO plan_id FROM subscription_plans WHERE merchant_id = m_id LIMIT 1;

  INSERT IGNORE INTO developer_profiles (uuid, user_id, organization_id, company_name, website, sandbox_enabled)
  SELECT UUID(), u.id, org_id, 'Demo Dev Co', 'https://demo.dev', 1
  FROM users u WHERE u.deleted_at IS NULL LIMIT 1;

  INSERT IGNORE INTO sandbox_accounts (uuid, organization_id, merchant_id, account_name, api_key_prefix, status)
  VALUES (UUID(), org_id, m_id, 'Default Sandbox', CONCAT('sb_', LEFT(MD5(org_id), 8)), 'active');

  INSERT IGNORE INTO invoice_templates (uuid, organization_id, code, name, tax_breakdown, is_default)
  VALUES (UUID(), org_id, 'standard', 'Standard Invoice', 1, 1);

  -- Subscriptions bulk (100K)
  SET i = 1;
  WHILE i <= 100000 DO
    IF plan_id IS NOT NULL AND cust_id IS NOT NULL THEN
      INSERT IGNORE INTO subscriptions (uuid, organization_id, merchant_id, customer_id, plan_id, subscription_ref, status,
        start_date, next_billing_date, dunning_stage)
      VALUES (UUID(), org_id, m_id, cust_id, plan_id, CONCAT('SUB-E', LPAD(i, 7, '0')),
        ELT(1+(i MOD 6), 'active','active','paused','cancelled','failed','renewed'),
        DATE_SUB(CURDATE(), INTERVAL (i MOD 365) DAY),
        DATE_ADD(CURDATE(), INTERVAL (i MOD 30) DAY),
        IF(i MOD 20 = 0, 1+(i MOD 3), 0));
    END IF;
    SET i = i + 1;
    IF i MOD batch = 0 THEN COMMIT; END IF;
  END WHILE;

  -- Invoices bulk (500K)
  SET i = 1;
  WHILE i <= 500000 DO
    IF cust_id IS NOT NULL THEN
      INSERT IGNORE INTO invoices (uuid, organization_id, merchant_id, customer_id, invoice_number, issue_date, due_date,
        status, subtotal, total, balance_due, is_recurring)
      VALUES (UUID(), org_id, m_id, cust_id, CONCAT('INV-E', LPAD(i, 7, '0')),
        DATE_SUB(CURDATE(), INTERVAL (i MOD 180) DAY),
        DATE_ADD(DATE_SUB(CURDATE(), INTERVAL (i MOD 180) DAY), INTERVAL 30 DAY),
        ELT(1+(i MOD 7), 'draft','sent','viewed','partially_paid','paid','overdue','cancelled'),
        ROUND(50+RAND()*5000,2), ROUND(50+RAND()*5000,2), ROUND(RAND()*1000,2),
        IF(i MOD 10 = 0, 1, 0));
    END IF;
    SET i = i + 1;
    IF i MOD batch = 0 THEN COMMIT; END IF;
  END WHILE;

  -- Reconciliation import + records (200K)
  INSERT INTO reconciliation_imports (uuid, organization_id, merchant_id, import_ref, source_type, file_name, status, total_rows, matched_rows, unmatched_rows, completed_at)
  VALUES (UUID(), org_id, m_id, CONCAT('RECON-', DATE_FORMAT(NOW(), '%Y%m%d')), 'csv', 'bank_statement.csv', 'completed', 200000, 160000, 40000, NOW());
  SET imp_id = LAST_INSERT_ID();

  SET i = 1;
  WHILE i <= 200000 DO
    INSERT IGNORE INTO reconciliation_records (uuid, import_id, organization_id, merchant_id, external_ref, amount, currency,
      record_date, record_type, match_status)
    VALUES (UUID(), imp_id, org_id, m_id, CONCAT('EXT-', LPAD(i, 8, '0')), ROUND(10+RAND()*5000,2), 'USD',
      DATE_SUB(CURDATE(), INTERVAL (i MOD 90) DAY),
      ELT(1+(i MOD 4), 'settlement','refund','chargeback','fee'),
      ELT(1+(i MOD 5), 'unmatched','auto_matched','auto_matched','manual_matched','exception'));
    SET i = i + 1;
    IF i MOD batch = 0 THEN COMMIT; END IF;
  END WHILE;

  -- Disputes bulk (50K) - extend existing if transactions exist
  SET i = 1;
  WHILE i <= 50000 DO
    SET row_offset = i MOD 1000;
    INSERT IGNORE INTO transaction_disputes (uuid, transaction_id, merchant_id, customer_id, dispute_ref, reason, reason_code,
      status, amount, currency, evidence_due_at, sla_due_at, representment_status, arbitration_status)
    SELECT UUID(), t.id, m_id, t.customer_id, CONCAT('DSP-E', LPAD(i, 7, '0')), 'Demo dispute',
      ELT(1+(i MOD 5), 'fraud','product_not_received','duplicate','subscription_cancelled','other'),
      ELT(1+(i MOD 6), 'open','evidence_required','under_review','representment_submitted','won','lost'),
      t.amount, t.currency,
      DATE_ADD(NOW(), INTERVAL 7 DAY), DATE_ADD(NOW(), INTERVAL 14 DAY),
      ELT(1+(i MOD 4), 'none','pending','submitted','won'),
      IF(i MOD 10 = 0, 'pending', 'none')
    FROM transactions t WHERE t.merchant_id = m_id ORDER BY t.id LIMIT row_offset, 1;
    SET i = i + 1;
    IF i MOD batch = 0 THEN COMMIT; END IF;
  END WHILE;

  -- Webhook endpoint + deliveries (1M)
  INSERT IGNORE INTO merchant_webhooks (uuid, merchant_id, organization_id, url, event_types, secret_hash, is_active, health_status)
  VALUES (UUID(), m_id, org_id, 'https://hooks.demo.example/events', JSON_ARRAY('payment.success','payment.failed','refund.created'), SHA2('demo-secret',256), 1, 'healthy');
  SELECT id INTO wh_id FROM merchant_webhooks WHERE merchant_id = m_id ORDER BY id DESC LIMIT 1;

  IF wh_id IS NOT NULL THEN
    SET i = 1;
    WHILE i <= 1000000 DO
      INSERT IGNORE INTO webhook_delivery_queue (uuid, webhook_id, merchant_id, event_type, payload, status, attempt_count,
        last_response_code, delivered_at, created_at)
      VALUES (UUID(), wh_id, m_id,
        ELT(1+(i MOD 3), 'payment.success','payment.failed','refund.created'),
        JSON_OBJECT('id', i, 'amount', ROUND(RAND()*1000,2)),
        ELT(1+(i MOD 6), 'delivered','delivered','delivered','failed','pending','dead_letter'),
        IF(i MOD 5 = 0, 3, 1),
        IF(i MOD 5 = 0, 500, 200),
        IF(i MOD 3 = 0, NULL, DATE_SUB(NOW(), INTERVAL (i MOD 30) DAY)),
        DATE_SUB(NOW(), INTERVAL (i MOD 30) DAY));
      SET i = i + 1;
      IF i MOD batch = 0 THEN COMMIT; END IF;
    END WHILE;
  END IF;

  -- API usage logs (50K sample)
  SET i = 1;
  WHILE i <= 50000 DO
    INSERT IGNORE INTO api_usage_logs (uuid, organization_id, method, path, status_code, latency_ms, environment, ip_address, created_at)
    VALUES (UUID(), org_id,
      ELT(1+(i MOD 4), 'GET','POST','PUT','DELETE'),
      ELT(1+(i MOD 5), '/v1/payments','/v1/customers','/v1/invoices','/v1/subscriptions','/v1/webhooks'),
      IF(i MOD 20 = 0, 500, 200), 50+(i MOD 200),
      IF(i MOD 2 = 0, 'sandbox', 'live'),
      CONCAT('192.168.', (i MOD 255), '.', (i MOD 255)),
      DATE_SUB(NOW(), INTERVAL (i MOD 7) DAY));
    SET i = i + 1;
    IF i MOD batch = 0 THEN COMMIT; END IF;
  END WHILE;

  -- AI insights (90 days)
  SET i = 1;
  WHILE i <= 90 DO
    INSERT IGNORE INTO ai_insights_daily (organization_id, merchant_id, insight_date, revenue_forecast, settlement_forecast,
      merchant_health_score, fraud_risk_score, insights_json)
    VALUES (org_id, m_id, DATE_SUB(CURDATE(), INTERVAL i DAY),
      ROUND(10000+RAND()*50000,2), ROUND(8000+RAND()*40000,2),
      ROUND(70+RAND()*25,2), ROUND(5+RAND()*30,2),
      JSON_OBJECT('trend', IF(i MOD 2 = 0, 'up', 'stable')));
    SET i = i + 1;
  END WHILE;

  -- Communication campaigns
  INSERT IGNORE INTO communication_campaigns (uuid, organization_id, name, channel, status, sent_count)
  VALUES
    (UUID(), org_id, 'Payment Reminder', 'email', 'completed', 12500),
    (UUID(), org_id, 'Subscription Renewal', 'sms', 'running', 3400),
    (UUID(), org_id, 'Invoice Due', 'whatsapp', 'scheduled', 0);

END //
DELIMITER ;
