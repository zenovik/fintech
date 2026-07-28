-- =============================================================================
-- 52_enterprise_payments_bulk_demo.sql
-- Bulk demo: 1000 devices, 500 QR codes, 100000 transactions, fraud/risk/inventory
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_seed_enterprise_payments_demo;

DELIMITER //
CREATE PROCEDURE sp_seed_enterprise_payments_demo()
BEGIN
  DECLARE i INT DEFAULT 1;
  DECLARE m_id BIGINT;
  DECLARE o_id BIGINT;
  DECLARE org_id BIGINT DEFAULT 1;
  DECLARE dev_id BIGINT;
  DECLARE qr_id BIGINT;
  DECLARE pm_id TINYINT DEFAULT 1;
  DECLARE st_id TINYINT DEFAULT 1;
  DECLARE reg_id TINYINT DEFAULT 1;
  DECLARE batch_size INT DEFAULT 1000;
  DECLARE txn_offset INT DEFAULT 0;
  DECLARE merch_offset INT DEFAULT 0;
  DECLARE row_offset INT DEFAULT 0;

  SELECT id INTO st_id FROM transaction_statuses WHERE code = 'success' LIMIT 1;
  SELECT id INTO reg_id FROM regions LIMIT 1;
  SELECT id INTO m_id FROM merchants WHERE deleted_at IS NULL ORDER BY id LIMIT 1;
  SELECT id INTO o_id FROM merchant_outlets WHERE merchant_id = m_id AND deleted_at IS NULL ORDER BY id LIMIT 1;

  IF m_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No merchant found for bulk demo seed';
  END IF;

  -- Merchant payment method configs for first 20 merchants
  SET i = 1;
  WHILE i <= 20 DO
    SET merch_offset = i - 1;
    SELECT id INTO m_id FROM merchants WHERE deleted_at IS NULL ORDER BY id LIMIT merch_offset, 1;
    IF m_id IS NOT NULL THEN
      INSERT IGNORE INTO merchant_payment_method_config
        (uuid, merchant_id, organization_id, payment_method_type_id, status, settlement_cycle, mdr_pct, fixed_fee, daily_limit, per_txn_limit)
      SELECT UUID(), m_id, organization_id, pmt.id, 'active', 't1', 2.0, 0.30, 500000, 50000
      FROM merchants m
      CROSS JOIN payment_method_types pmt
      WHERE m.id = m_id AND pmt.is_active = 1
      LIMIT 11;
    END IF;
    SET i = i + 1;
  END WHILE;

  -- 1000 devices
  SET i = 1;
  WHILE i <= 1000 DO
    INSERT INTO payment_devices (
      uuid, device_ref, serial_number, device_id, device_type, model, manufacturer,
      firmware_version, status, merchant_id, outlet_id, organization_id,
      health_status, battery_pct, network_type, activated_at, last_sync_at
    ) VALUES (
      UUID(),
      CONCAT('DEV-', LPAD(i, 6, '0')),
      CONCAT('SN', LPAD(i, 10, '0')),
      CONCAT('DID-', LPAD(i, 8, '0')),
      ELT(1 + (i MOD 6), 'pos','mpos','softpos','android_pos','qr_stand','soundbox'),
      CONCAT('Model-', (i MOD 20) + 1),
      ELT(1 + (i MOD 4), 'Pax','Ingenico','Verifone','Sunmi'),
      CONCAT('v', FLOOR(1 + RAND() * 5), '.', FLOOR(RAND() * 10)),
      ELT(1 + (i MOD 5), 'provisioned','active','active','active','inactive'),
      IF(i MOD 3 = 0, NULL, m_id),
      IF(i MOD 4 = 0, NULL, o_id),
      org_id,
      ELT(1 + (i MOD 4), 'healthy','healthy','warning','offline'),
      FLOOR(20 + RAND() * 80),
      ELT(1 + (i MOD 3), '4G','WiFi','Ethernet'),
      IF(i MOD 3 = 0, NULL, DATE_SUB(NOW(), INTERVAL (i MOD 365) DAY)),
      DATE_SUB(NOW(), INTERVAL (i MOD 72) HOUR)
    );
    SET i = i + 1;
  END WHILE;

  -- Terminal inventory (500 units)
  SET i = 1;
  WHILE i <= 500 DO
    INSERT INTO terminal_inventory (
      uuid, inventory_ref, serial_number, device_type, model, manufacturer,
      warehouse_code, status, organization_id
    ) VALUES (
      UUID(),
      CONCAT('INV-', LPAD(i, 6, '0')),
      CONCAT('WH-SN', LPAD(i, 10, '0')),
      ELT(1 + (i MOD 6), 'pos','mpos','softpos','android_pos','qr_stand','soundbox'),
      CONCAT('WH-Model-', (i MOD 10) + 1),
      ELT(1 + (i MOD 3), 'Pax','Ingenico','Verifone'),
      ELT(1 + (i MOD 3), 'MAIN','NORTH','SOUTH'),
      ELT(1 + (i MOD 6), 'in_stock','in_stock','assigned','returned','damaged','lost'),
      org_id
    );
    SET i = i + 1;
  END WHILE;

  -- 500 QR codes (outlet, table, multi types)
  SET i = 1;
  WHILE i <= 500 DO
    INSERT INTO qr_codes (
      uuid, organization_id, merchant_id, outlet_id, table_label,
      qr_ref, qr_type, title, amount, currency, allow_custom_amount,
      status, public_token, scan_count
    ) VALUES (
      UUID(), org_id, m_id,
      IF(i MOD 5 = 0, NULL, o_id),
      IF(i MOD 7 = 0, CONCAT('T-', (i MOD 50) + 1), NULL),
      CONCAT('QR-DEMO-', LPAD(i, 5, '0')),
      ELT(1 + (i MOD 7), 'static','dynamic','merchant','outlet','table','multi','dynamic'),
      CONCAT('Demo QR ', i),
      IF(i MOD 3 = 0, NULL, ROUND(50 + RAND() * 5000, 2)),
      'USD', IF(i MOD 3 = 0, 1, 0),
      IF(i MOD 20 = 0, 'disabled', 'active'),
      CONCAT('qrtok', MD5(CONCAT('demo', i, NOW()))),
      FLOOR(RAND() * 500)
    );
    SET i = i + 1;
  END WHILE;

  -- 100000 transactions in batches
  SET txn_offset = (SELECT COALESCE(MAX(id), 0) FROM transactions);
  SET i = 1;
  WHILE i <= 100000 DO
    SET pm_id = 1 + (i MOD 6);
    INSERT INTO transactions (
      uuid, transaction_ref, merchant_id, customer_name, customer_email,
      description, amount, fee_amount, net_amount, currency,
      payment_method_type_id, payment_method_detail, status_id, region_id,
      is_high_value, processed_at, created_at
    ) VALUES (
      UUID(),
      CONCAT('TXN-DEMO-', LPAD(txn_offset + i, 8, '0')),
      m_id,
      CONCAT('Customer ', (i MOD 10000)),
      CONCAT('cust', i MOD 10000, '@demo.com'),
      CONCAT('Demo transaction #', i),
      ROUND(10 + RAND() * 9990, 2),
      ROUND(RAND() * 50, 2),
      NULL, 'USD',
      pm_id,
      ELT(1 + (i MOD 4), '****4242','UPI@demo','NB-HDFC','Wallet-Pay'),
      IF(i MOD 50 = 0, (SELECT id FROM transaction_statuses WHERE code = 'failed' LIMIT 1), st_id),
      reg_id,
      IF(RAND() > 0.95, 1, 0),
      DATE_SUB(NOW(), INTERVAL (i MOD 365) DAY) + INTERVAL (i MOD 86400) SECOND,
      DATE_SUB(NOW(), INTERVAL (i MOD 365) DAY)
    );
    IF i MOD batch_size = 0 THEN
      COMMIT;
    END IF;
    SET i = i + 1;
  END WHILE;

  -- Fraud cases (200)
  SET i = 1;
  WHILE i <= 200 DO
    INSERT INTO fraud_cases (
      uuid, case_ref, organization_id, merchant_id, fraud_score, status,
      source, title, description
    ) VALUES (
      UUID(),
      CONCAT('FC-', LPAD(i, 6, '0')),
      org_id, m_id,
      ROUND(RAND() * 100, 2),
      ELT(1 + (i MOD 5), 'pending','under_review','approved','rejected','released'),
      ELT(1 + (i MOD 3), 'risk_engine','manual','device_risk'),
      CONCAT('Fraud Case #', i),
      CONCAT('Automated fraud detection case ', i)
    );
    SET i = i + 1;
  END WHILE;

  -- Transaction limit rules
  INSERT IGNORE INTO transaction_limit_rules (uuid, rule_name, scope_type, merchant_id, organization_id, per_txn_limit, daily_limit, weekly_limit, monthly_limit)
  VALUES
    (UUID(), 'Merchant Daily Cap', 'merchant', m_id, org_id, 100000, 500000, 2000000, 8000000),
    (UUID(), 'Outlet Daily Cap', 'outlet', m_id, org_id, 50000, 250000, NULL, NULL);

  UPDATE transaction_limit_rules SET outlet_id = o_id WHERE rule_name = 'Outlet Daily Cap';

  -- Sample ledger entries
  SET i = 1;
  WHILE i <= 100 DO
    INSERT INTO ledger_entries (uuid, entry_ref, account_id, entry_type, amount, currency, reference_type, description)
    VALUES (
      UUID(), CONCAT('LE-', LPAD(i, 6, '0')),
      1 + (i MOD 5), IF(i MOD 2 = 0, 'credit', 'debit'),
      ROUND(100 + RAND() * 10000, 2), 'USD', 'settlement',
      CONCAT('Demo ledger entry ', i)
    );
    SET i = i + 1;
  END WHILE;

END //
DELIMITER ;

CALL sp_seed_enterprise_payments_demo();
DROP PROCEDURE IF EXISTS sp_seed_enterprise_payments_demo;
