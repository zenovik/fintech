-- =============================================================================
-- 54_dummy_data_hosted_checkout.sql
-- Checkout permissions, themes, branding, 10k checkout sessions demo
-- =============================================================================

INSERT INTO permissions (id, uuid, code, name, module, description) VALUES
(123, 'p1000123-0000-4000-8000-000000000123', 'checkout:read',      'View Checkout',        'checkout', 'View checkout sessions and config'),
(124, 'p1000124-0000-4000-8000-000000000124', 'checkout:write',     'Create Checkout',    'checkout', 'Create hosted checkout sessions'),
(125, 'p1000125-0000-4000-8000-000000000125', 'checkout:manage',    'Manage Checkout',    'checkout', 'Manage themes and checkout settings'),
(126, 'p1000126-0000-4000-8000-000000000126', 'checkout:analytics', 'Checkout Analytics', 'checkout', 'View checkout analytics dashboards'),
(127, 'p1000127-0000-4000-8000-000000000127', 'checkout:branding',  'Checkout Branding',  'checkout', 'Manage merchant checkout branding')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO role_permissions (role_id, permission_id) VALUES
(1, 123), (1, 124), (1, 125), (1, 126), (1, 127),
(2, 123), (2, 124), (2, 126),
(5, 123), (5, 124)
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

INSERT INTO checkout_themes (uuid, code, name, primary_color, secondary_color, accent_color, font_family, button_style, border_radius) VALUES
('ct000001-0000-4000-8000-000000000001', 'enterprise_blue', 'Enterprise Blue', '#003d9b', '#64748b', '#4f46e5', 'Inter, sans-serif', 'rounded', '12px'),
('ct000002-0000-4000-8000-000000000002', 'modern_dark',     'Modern Dark',     '#1e293b', '#94a3b8', '#6366f1', 'Inter, sans-serif', 'pill', '999px'),
('ct000003-0000-4000-8000-000000000003', 'minimal_light',   'Minimal Light',   '#0f172a', '#cbd5e1', '#059669', 'system-ui, sans-serif', 'square', '4px')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO merchant_checkout_branding (uuid, merchant_id, organization_id, theme_id, logo_url, primary_color, support_email, support_phone, terms_url, privacy_url, merchant_name, merchant_address, allowed_origins)
SELECT UUID(), m.id, m.organization_id, 1, NULL, '#003d9b', 'support@merchantpro.com', '+1-800-555-0100',
  'https://merchantpro.com/terms', 'https://merchantpro.com/privacy', m.display_name, '100 Fintech Plaza, NY 10001',
  JSON_ARRAY('https://merchantpro.com', 'http://localhost:4200')
FROM merchants m WHERE m.deleted_at IS NULL ORDER BY m.id LIMIT 20
ON DUPLICATE KEY UPDATE support_email = VALUES(support_email);

INSERT INTO audit_actions (uuid, code, name, category_code, description, risk_level) VALUES
('aa000080-0000-4000-8000-000000000080', 'checkout_created',  'Checkout Created',  'checkout', 'Hosted checkout session created', 'low'),
('aa000081-0000-4000-8000-000000000081', 'checkout_completed','Checkout Completed','checkout', 'Checkout payment completed', 'low'),
('aa000082-0000-4000-8000-000000000082', 'checkout_failed',   'Checkout Failed',   'checkout', 'Checkout payment failed', 'medium')
ON DUPLICATE KEY UPDATE name = VALUES(name);

DROP PROCEDURE IF EXISTS sp_seed_hosted_checkout_demo;

DELIMITER //
CREATE PROCEDURE sp_seed_hosted_checkout_demo()
BEGIN
  DECLARE i INT DEFAULT 1;
  DECLARE m_id BIGINT;
  DECLARE org_id BIGINT;
  DECLARE pi_id BIGINT;
  DECLARE cs_id BIGINT;
  DECLARE st VARCHAR(20);
  DECLARE mode VARCHAR(10);
  DECLARE batch INT DEFAULT 500;
  DECLARE row_offset INT DEFAULT 0;

  SELECT id, organization_id INTO m_id, org_id FROM merchants WHERE deleted_at IS NULL ORDER BY id LIMIT 1;
  IF m_id IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No merchant for checkout demo'; END IF;

  WHILE i <= 10000 DO
    SET st = ELT(1 + (i MOD 6), 'open','complete','complete','expired','cancelled','abandoned');
    SET mode = ELT(1 + (i MOD 3), 'hosted','embed','popup');

    SET row_offset = i MOD 1000;
    SELECT id INTO pi_id FROM payment_intents WHERE merchant_id = m_id ORDER BY id LIMIT row_offset, 1;
    IF pi_id IS NULL THEN
      INSERT INTO payment_intents (uuid, intent_ref, merchant_id, organization_id, status, amount, currency, payment_method_code, expires_at)
      VALUES (UUID(), CONCAT('PI-CHK-', LPAD(i, 8, '0')), m_id, org_id, 'pending', ROUND(50+RAND()*500,2), 'USD', 'card', DATE_ADD(NOW(), INTERVAL 1 DAY));
      SET pi_id = LAST_INSERT_ID();
    END IF;

    INSERT INTO checkout_sessions (uuid, checkout_ref, client_secret, recovery_token, payment_intent_id, merchant_id, organization_id,
      amount, currency, locale, theme_id, checkout_mode, status, success_url, failure_url, cancel_url, pending_url,
      retry_count, expires_at, viewed_at, payment_started_at, completed_at, browser, os_name, country_code, device_type)
    VALUES (UUID(), CONCAT('chk_', MD5(CONCAT('demo', i))), CONCAT('cs_', MD5(CONCAT('sec', i))),
      CONCAT('rcv_', MD5(CONCAT('rec', i))), pi_id, m_id, org_id,
      ROUND(50+RAND()*500,2), 'USD', IF(i MOD 2 = 0, 'en-US', 'en-IN'), 1 + (i MOD 3), mode, st,
      'https://merchant.example/success', 'https://merchant.example/failure', 'https://merchant.example/cancel', 'https://merchant.example/pending',
      IF(st = 'complete', 0, (i MOD 3)), DATE_ADD(NOW(), INTERVAL IF(st='expired', -1, 1) DAY),
      IF(st != 'open', DATE_SUB(NOW(), INTERVAL (i MOD 60) MINUTE), NULL),
      IF(st IN ('complete','abandoned'), DATE_SUB(NOW(), INTERVAL (i MOD 30) MINUTE), NULL),
      IF(st = 'complete', DATE_SUB(NOW(), INTERVAL (i MOD 15) MINUTE), NULL),
      ELT(1+(i MOD 3),'Chrome','Safari','Firefox'), ELT(1+(i MOD 3),'Windows','macOS','Android'),
      ELT(1+(i MOD 4),'US','IN','GB','CA'), ELT(1+(i MOD 3),'desktop','mobile','tablet'));
    SET cs_id = LAST_INSERT_ID();

    INSERT INTO checkout_session_events (uuid, checkout_session_id, event_type, payment_method_code, browser, os_name, country_code, device_type)
    VALUES (UUID(), cs_id, 'created', NULL, 'Chrome', 'Windows', 'US', 'desktop');
    IF st != 'open' THEN
      INSERT INTO checkout_session_events (uuid, checkout_session_id, event_type, browser, country_code, device_type)
      VALUES (UUID(), cs_id, 'viewed', 'Chrome', 'US', 'desktop');
    END IF;
    IF st IN ('complete','abandoned') THEN
      INSERT INTO checkout_session_events (uuid, checkout_session_id, event_type, payment_method_code)
      VALUES (UUID(), cs_id, 'payment_started', ELT(1+(i MOD 5),'upi','card','wallet','netbanking','emi'));
    END IF;
    IF st = 'complete' THEN
      INSERT INTO checkout_session_events (uuid, checkout_session_id, event_type) VALUES (UUID(), cs_id, 'completed');
    ELSEIF st = 'abandoned' THEN
      INSERT INTO checkout_session_events (uuid, checkout_session_id, event_type) VALUES (UUID(), cs_id, 'abandoned');
    ELSEIF st = 'expired' THEN
      INSERT INTO checkout_session_events (uuid, checkout_session_id, event_type) VALUES (UUID(), cs_id, 'expired');
    END IF;

    IF i MOD batch = 0 THEN COMMIT; END IF;
    SET i = i + 1;
  END WHILE;

  INSERT INTO checkout_analytics_daily (merchant_id, organization_id, analytics_date, sessions_created, sessions_viewed, payments_started, payments_completed, payments_failed, sessions_abandoned, total_retries, avg_completion_sec, conversion_rate)
  VALUES (m_id, org_id, CURDATE(), 10000, 8500, 6200, 4500, 800, 1200, 2400, 45, 52.94)
  ON DUPLICATE KEY UPDATE sessions_created = VALUES(sessions_created), conversion_rate = VALUES(conversion_rate);

END //
DELIMITER ;

CALL sp_seed_hosted_checkout_demo();
DROP PROCEDURE IF EXISTS sp_seed_hosted_checkout_demo;
