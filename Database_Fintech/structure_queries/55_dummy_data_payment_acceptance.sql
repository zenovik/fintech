-- =============================================================================
-- 55_dummy_data_payment_acceptance.sql
-- Permissions, QR templates/categories, smart collect demo, bulk seed procedures
-- =============================================================================

INSERT INTO permissions (id, uuid, code, name, module, description) VALUES
(128, 'p1000128-0000-4000-8000-000000000128', 'smart_collect:read',       'View Smart Collect',       'smart_collect', 'View virtual accounts and collections'),
(129, 'p1000129-0000-4000-8000-000000000129', 'smart_collect:write',      'Manage Smart Collect',     'smart_collect', 'Create virtual accounts and match collections'),
(130, 'p1000130-0000-4000-8000-000000000130', 'smart_collect:manage',     'Admin Smart Collect',      'smart_collect', 'Full smart collect administration'),
(131, 'p1000131-0000-4000-8000-000000000131', 'acceptance_analytics:read','Acceptance Analytics',     'acceptance',    'View payment acceptance analytics'),
(132, 'p1000132-0000-4000-8000-000000000132', 'merchant_portal:read',     'Merchant Portal',          'merchant_portal','Access merchant payment portal')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO role_permissions (role_id, permission_id) VALUES
(1, 128), (1, 129), (1, 130), (1, 131), (1, 132),
(2, 128), (2, 129), (2, 131), (2, 132),
(5, 128), (5, 131), (5, 132)
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

INSERT INTO qr_templates (uuid, code, name, layout, primary_color, frame_style, print_ready) VALUES
('qt000001-0000-4000-8000-000000000001', 'standard',  'Standard QR',  'standard', '#003d9b', 'rounded', 1),
('qt000002-0000-4000-8000-000000000002', 'branded',   'Branded QR',   'branded',  '#4f46e5', 'rounded', 1),
('qt000003-0000-4000-8000-000000000003', 'print_a4',  'Print Ready',  'print',    '#0f172a', 'square',  1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO qr_categories (uuid, organization_id, code, name)
SELECT UUID(), o.id, 'retail', 'Retail'
FROM organizations o WHERE o.status != 'archived' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO qr_categories (uuid, organization_id, code, name)
SELECT UUID(), o.id, 'restaurant', 'Restaurant'
FROM organizations o WHERE o.status != 'archived' LIMIT 1
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO audit_actions (uuid, code, name, category_code, description, risk_level) VALUES
('aa000090-0000-4000-8000-000000000090', 'va_created',        'Virtual Account Created', 'smart_collect', 'Virtual account provisioned', 'low'),
('aa000091-0000-4000-8000-000000000091', 'collection_matched','Collection Matched',      'smart_collect', 'Collection auto/manual matched', 'low'),
('aa000092-0000-4000-8000-000000000092', 'qr_bulk_generated', 'QR Bulk Generated',       'qr_payments',   'Bulk QR codes generated', 'low'),
('aa000093-0000-4000-8000-000000000093', 'link_cloned',       'Payment Link Cloned',     'payment_links', 'Payment link cloned', 'low')
ON DUPLICATE KEY UPDATE name = VALUES(name);

DROP PROCEDURE IF EXISTS sp_seed_payment_acceptance_demo;
DELIMITER //
CREATE PROCEDURE sp_seed_payment_acceptance_demo()
BEGIN
  DECLARE i INT DEFAULT 1;
  DECLARE m_id BIGINT;
  DECLARE org_id BIGINT;
  DECLARE o_id BIGINT;
  DECLARE va_id BIGINT;
  DECLARE batch INT DEFAULT 1000;
  DECLARE row_offset INT DEFAULT 0;

  SELECT id, organization_id INTO m_id, org_id FROM merchants WHERE deleted_at IS NULL ORDER BY id LIMIT 1;
  IF m_id IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No merchant for acceptance demo'; END IF;
  SELECT id INTO o_id FROM merchant_outlets WHERE merchant_id = m_id LIMIT 1;

  -- Virtual accounts (up to 5000 in loop, call multiple times or extend)
  SET i = 1;
  WHILE i <= 5000 DO
    INSERT IGNORE INTO virtual_accounts (uuid, organization_id, merchant_id, outlet_id, account_ref, account_number, ifsc_code, bank_name, account_type, expected_amount, status, expires_at)
    VALUES (UUID(), org_id, m_id, o_id, CONCAT('VA-', LPAD(i, 8, '0')), CONCAT('99', LPAD(i, 14, '0')),
      'HDFC0001234', 'HDFC Bank', IF(i MOD 5 = 0, 'temporary', 'dedicated'), ROUND(100+RAND()*5000,2),
      IF(i MOD 20 = 0, 'closed', 'active'), IF(i MOD 5 = 0, DATE_ADD(NOW(), INTERVAL 7 DAY), NULL));
    SET i = i + 1;
  END WHILE;

  -- Collections
  SET i = 1;
  WHILE i <= 50000 DO
    SET row_offset = i MOD 5000;
    SELECT id INTO va_id FROM virtual_accounts WHERE merchant_id = m_id ORDER BY id LIMIT row_offset, 1;
    IF va_id IS NOT NULL THEN
      INSERT IGNORE INTO collections (uuid, organization_id, merchant_id, virtual_account_id, collection_ref, amount, currency, utr_reference, payer_name, status, match_type, received_at, matched_at)
      VALUES (UUID(), org_id, m_id, va_id, CONCAT('COL-', LPAD(i, 8, '0')), ROUND(50+RAND()*10000,2), 'INR',
        CONCAT('UTR', LPAD(i, 12, '0')), CONCAT('Payer ', i),
        ELT(1+(i MOD 5), 'pending','matched','matched','unmatched','partial'),
        IF(i MOD 3 = 0, 'manual', IF(i MOD 2 = 0, 'auto', 'none')),
        DATE_SUB(NOW(), INTERVAL (i MOD 90) DAY),
        IF(i MOD 2 = 0, DATE_SUB(NOW(), INTERVAL (i MOD 90) DAY), NULL));
    END IF;
    SET i = i + 1;
    IF i MOD batch = 0 THEN COMMIT; END IF;
  END WHILE;

  -- Bulk QR codes
  SET i = 1;
  WHILE i <= 100000 DO
    INSERT IGNORE INTO qr_codes (uuid, organization_id, merchant_id, outlet_id, qr_ref, qr_type, title, amount, currency,
      allow_custom_amount, is_one_time, is_reusable, amount_locked, usage_limit, usage_count, template_id, status, public_token, scan_count, expires_at)
    VALUES (UUID(), org_id, m_id, o_id,
      CONCAT('QR-B', LPAD(i, 7, '0')),
      ELT(1+(i MOD 8), 'static','dynamic','intent','merchant','outlet','device','table','multi'),
      CONCAT('Demo QR ', i), IF(i MOD 3 = 0, NULL, ROUND(10+RAND()*500,2)), 'USD',
      IF(i MOD 3 = 0, 1, 0), IF(i MOD 10 = 0, 1, 0), IF(i MOD 10 = 0, 0, 1), IF(i MOD 4 = 0, 0, 1),
      IF(i MOD 10 = 0, 1, NULL), IF(i MOD 10 = 0, 1, 0), 1 + (i MOD 3),
      ELT(1+(i MOD 4), 'active','active','disabled','archived'),
      MD5(CONCAT('qr', i)), (i MOD 500),
      IF(i MOD 20 = 0, DATE_ADD(NOW(), INTERVAL 30 DAY), NULL));
    SET i = i + 1;
    IF i MOD batch = 0 THEN COMMIT; END IF;
  END WHILE;

  -- Bulk payment links
  SET i = 1;
  WHILE i <= 100000 DO
    INSERT IGNORE INTO payment_links (uuid, organization_id, merchant_id, link_ref, title, amount, currency,
      allow_custom_amount, allow_partial, is_one_time, is_reusable, min_amount, max_amount, short_code,
      visit_count, payment_started_count, abandonment_count, status, public_token, expires_at, customer_email)
    VALUES (UUID(), org_id, m_id, CONCAT('PL-B', LPAD(i, 7, '0')), CONCAT('Demo Link ', i),
      IF(i MOD 4 = 0, NULL, ROUND(25+RAND()*1000,2)), 'USD',
      IF(i MOD 4 = 0, 1, 0), IF(i MOD 5 = 0, 1, 0), IF(i MOD 15 = 0, 1, 0), IF(i MOD 15 = 0, 0, 1),
      IF(i MOD 4 = 0, 10, NULL), IF(i MOD 4 = 0, 5000, NULL),
      CONCAT('s', SUBSTRING(MD5(CONCAT('sc', i)), 1, 8)),
      (i MOD 200), (i MOD 50), (i MOD 30),
      ELT(1+(i MOD 3), 'active','disabled','expired'),
      MD5(CONCAT('pl', i)),
      IF(i MOD 10 = 0, DATE_ADD(NOW(), INTERVAL 14 DAY), NULL),
      CONCAT('customer', i, '@demo.com'));
    SET i = i + 1;
    IF i MOD batch = 0 THEN COMMIT; END IF;
  END WHILE;

  -- Customer preferences for existing customers
  INSERT IGNORE INTO customer_preferences (uuid, customer_id, organization_id, locale, currency, default_payment_method, communication_channel)
  SELECT UUID(), c.id, c.organization_id, 'en-US', 'USD', 'card', 'email'
  FROM customers c WHERE c.deleted_at IS NULL LIMIT 50000;

  -- Analytics rollups sample
  SET i = 1;
  WHILE i <= 365 DO
    INSERT IGNORE INTO acceptance_analytics_daily (organization_id, merchant_id, analytics_date, qr_scans, qr_payments, qr_amount, link_visits, link_payments, link_abandonments, link_amount, collections_received, collections_matched, collections_amount, conversion_rate, retry_rate, top_payment_method)
    VALUES (org_id, m_id, DATE_SUB(CURDATE(), INTERVAL i DAY),
      50 + (i MOD 200), 10 + (i MOD 50), ROUND(5000+RAND()*50000,2),
      80 + (i MOD 300), 15 + (i MOD 60), 5 + (i MOD 20), ROUND(8000+RAND()*80000,2),
      20 + (i MOD 40), 15 + (i MOD 30), ROUND(10000+RAND()*100000,2),
      ROUND(15+RAND()*25, 3), ROUND(2+RAND()*8, 3), ELT(1+(i MOD 4), 'card','upi','netbanking','wallet'));
    SET i = i + 1;
  END WHILE;
END //
DELIMITER ;

-- CALL sp_seed_payment_acceptance_demo(); -- run manually after migration
