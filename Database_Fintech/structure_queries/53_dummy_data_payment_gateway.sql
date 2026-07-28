-- =============================================================================
-- 53_dummy_data_payment_gateway.sql
-- Payment gateway permissions, notification/audit events, 100k payment demo
-- =============================================================================

INSERT INTO permissions (id, uuid, code, name, module, description) VALUES
(118, 'p1000118-0000-4000-8000-000000000118', 'payments:read',    'View Payments',       'payments', 'View payment intents, orders, sessions'),
(119, 'p1000119-0000-4000-8000-000000000119', 'payments:write',   'Create Payments',   'payments', 'Create payments, sessions, and orders'),
(120, 'p1000120-0000-4000-8000-000000000120', 'payments:capture', 'Capture Payments',  'payments', 'Capture and authorize payments'),
(121, 'p1000121-0000-4000-8000-000000000121', 'payments:refund',  'Refund Payments',   'payments', 'Refund captured payments'),
(122, 'p1000122-0000-4000-8000-000000000122', 'payments:manage',  'Manage Payments',   'payments', 'Cancel, void, retry, and manage payment lifecycle')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO role_permissions (role_id, permission_id) VALUES
(1, 118), (1, 119), (1, 120), (1, 121), (1, 122),
(2, 118), (2, 119), (2, 120), (2, 121),
(5, 118), (5, 119)
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

INSERT INTO notification_events (uuid, code, name, category, description, is_enabled) VALUES
('ne000070-0000-4000-8000-000000000070', 'payment_success',  'Payment Success',  'financial', 'Payment captured successfully', 1),
('ne000071-0000-4000-8000-000000000071', 'payment_failed',   'Payment Failed',   'financial', 'Payment authorization or capture failed', 1),
('ne000072-0000-4000-8000-000000000072', 'payment_refunded', 'Payment Refunded', 'financial', 'Payment refund processed', 1),
('ne000073-0000-4000-8000-000000000073', 'payment_settled',  'Payment Settled',  'financial', 'Payment settled to merchant', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO audit_actions (uuid, code, name, category_code, description, risk_level) VALUES
('aa000070-0000-4000-8000-000000000070', 'payment_created',    'Payment Created',    'payments', 'Payment intent created', 'low'),
('aa000071-0000-4000-8000-000000000071', 'payment_authorized', 'Payment Authorized', 'payments', 'Payment authorized', 'low'),
('aa000072-0000-4000-8000-000000000072', 'payment_captured',   'Payment Captured',   'payments', 'Payment captured', 'medium'),
('aa000073-0000-4000-8000-000000000073', 'payment_refunded',   'Payment Refunded',   'payments', 'Payment refunded', 'medium'),
('aa000074-0000-4000-8000-000000000074', 'payment_cancelled',  'Payment Cancelled',  'payments', 'Payment cancelled or voided', 'low'),
('aa000075-0000-4000-8000-000000000075', 'payment_failed',     'Payment Failed',     'payments', 'Payment failed', 'medium')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Sample customer payment methods
INSERT INTO customer_payment_methods (uuid, customer_id, merchant_id, organization_id, method_type, provider, last_four, brand, token_ref, vpa, wallet_balance, is_default) VALUES
('cpm00001-0000-4000-8000-000000000001', 1, 1, 1, 'card', 'visa', '4242', 'Visa', 'tok_visa_4242', NULL, 0, 1),
('cpm00002-0000-4000-8000-000000000002', 1, 1, 1, 'upi', 'npci', NULL, NULL, NULL, 'customer@upi', 0, 0),
('cpm00003-0000-4000-8000-000000000003', 2, 1, 1, 'wallet', 'paytm', NULL, 'Paytm', 'wlt_paytm_001', NULL, 1500.00, 1)
ON DUPLICATE KEY UPDATE token_ref = VALUES(token_ref);

DROP PROCEDURE IF EXISTS sp_seed_payment_gateway_demo;

DELIMITER //
CREATE PROCEDURE sp_seed_payment_gateway_demo()
BEGIN
  DECLARE i INT DEFAULT 1;
  DECLARE m_id BIGINT;
  DECLARE org_id BIGINT DEFAULT 1;
  DECLARE cust_id BIGINT;
  DECLARE order_id BIGINT;
  DECLARE intent_id BIGINT;
  DECLARE txn_id BIGINT;
  DECLARE pm_id TINYINT;
  DECLARE st_status VARCHAR(30);
  DECLARE order_st VARCHAR(20);
  DECLARE amt DECIMAL(18,2);
  DECLARE cap_amt DECIMAL(18,2);
  DECLARE batch_size INT DEFAULT 2000;

  SELECT id INTO m_id FROM merchants WHERE deleted_at IS NULL ORDER BY id LIMIT 1;
  SELECT id INTO cust_id FROM customers WHERE organization_id = org_id ORDER BY id LIMIT 1;

  IF m_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No merchant for payment gateway demo';
  END IF;

  SET i = 1;
  WHILE i <= 100000 DO
    SET pm_id = ELT(1 + (i MOD 9), 1, 2, 3, 4, 5, 6, 9, 10, 11);
    SET amt = ROUND(10 + RAND() * 9990, 2);
    SET st_status = ELT(1 + (i MOD 11),
      'pending','processing','authorized','captured','captured','settled',
      'failed','expired','refunded','partially_refunded','chargeback');
    SET order_st = CASE
      WHEN st_status IN ('captured','settled') THEN 'paid'
      WHEN st_status = 'partially_refunded' THEN 'partial_paid'
      WHEN st_status IN ('refunded') THEN 'refunded'
      WHEN st_status IN ('failed','expired') THEN 'pending'
      WHEN st_status = 'cancelled' THEN 'cancelled'
      ELSE 'pending'
    END;
    SET cap_amt = IF(st_status IN ('captured','settled','refunded','partially_refunded','chargeback'),
      IF(st_status = 'partially_refunded', ROUND(amt * 0.5, 2), amt), 0);

    INSERT INTO payment_orders (uuid, order_ref, merchant_order_id, merchant_id, organization_id, customer_id,
      status, currency, amount, amount_paid, amount_refunded, description, expires_at)
    VALUES (UUID(), CONCAT('ORD-DEMO-', LPAD(i, 8, '0')), CONCAT('MO-', i), m_id, org_id, cust_id,
      order_st, 'USD', amt,
      IF(order_st IN ('paid','partial_paid'), cap_amt, 0),
      IF(st_status IN ('refunded','partially_refunded'), IF(st_status = 'partially_refunded', ROUND(amt * 0.5, 2), amt), 0),
      CONCAT('Gateway order #', i), DATE_ADD(NOW(), INTERVAL 7 DAY));
    SET order_id = LAST_INSERT_ID();

    INSERT INTO payment_intents (uuid, intent_ref, order_id, merchant_id, organization_id, customer_id,
      status, amount, amount_captured, amount_refunded, currency, payment_method_type_id, payment_method_code,
      merchant_order_id, gateway_transaction_id, acquirer_reference, rrn,
      authorized_at, captured_at, settled_at, expires_at)
    VALUES (UUID(), CONCAT('PI-DEMO-', LPAD(i, 8, '0')), order_id, m_id, org_id, cust_id,
      st_status, amt, cap_amt,
      IF(st_status IN ('refunded','partially_refunded'), IF(st_status = 'partially_refunded', ROUND(amt * 0.5, 2), amt), 0),
      'USD', pm_id,
      ELT(1 + (i MOD 10), 'upi','card','netbanking','wallet','emi','bnpl','payment_link','subscription','qr','tap_to_pay'),
      CONCAT('MO-', i),
      CONCAT('GWX-', LPAD(i, 10, '0')),
      CONCAT('ACQ-', LPAD(i, 8, '0')),
      CONCAT('RRN', LPAD(i, 12, '0')),
      IF(st_status IN ('authorized','captured','settled','partially_refunded','refunded','chargeback'), DATE_SUB(NOW(), INTERVAL (i MOD 30) DAY), NULL),
      IF(st_status IN ('captured','settled','partially_refunded','refunded','chargeback'), DATE_SUB(NOW(), INTERVAL (i MOD 25) DAY), NULL),
      IF(st_status = 'settled', DATE_SUB(NOW(), INTERVAL (i MOD 20) DAY), NULL),
      DATE_ADD(NOW(), INTERVAL 1 DAY));
    SET intent_id = LAST_INSERT_ID();

    IF st_status IN ('captured','settled','refunded','partially_refunded','chargeback') THEN
      INSERT INTO transactions (uuid, transaction_ref, merchant_id, customer_id, payment_intent_id,
        customer_name, customer_email, description, amount, fee_amount, net_amount, currency,
        payment_method_type_id, payment_method_detail, status_id, region_id, is_high_value, processed_at)
      SELECT UUID(), CONCAT('TXN-PI-', LPAD(i, 8, '0')), m_id, cust_id, intent_id,
        'Demo Customer', CONCAT('cust', i MOD 1000, '@demo.com'), CONCAT('Payment intent #', i),
        cap_amt, ROUND(cap_amt * 0.025, 2), ROUND(cap_amt * 0.975, 2), 'USD',
        pm_id, '****4242', ts.id, 1, IF(cap_amt >= 50000, 1, 0),
        DATE_SUB(NOW(), INTERVAL (i MOD 365) DAY)
      FROM transaction_statuses ts WHERE ts.code = 'success' LIMIT 1;
      SET txn_id = LAST_INSERT_ID();
      UPDATE payment_intents SET transaction_id = txn_id WHERE id = intent_id;
    END IF;

    INSERT INTO payment_timeline_events (uuid, payment_intent_id, event_type, from_status, to_status, description)
    VALUES
      (UUID(), intent_id, 'created', NULL, 'pending', 'Payment intent created'),
      (UUID(), intent_id, 'intent', 'pending', st_status, CONCAT('Status transitioned to ', st_status));

    IF i MOD 500 = 0 THEN
      INSERT INTO payment_sessions (uuid, session_ref, merchant_id, organization_id, customer_id, order_id,
        payment_intent_id, status, amount, currency, client_secret, ip_address, browser, expires_at, completed_at)
      VALUES (UUID(), CONCAT('PS-DEMO-', LPAD(i, 8, '0')), m_id, org_id, cust_id, order_id, intent_id,
        IF(st_status IN ('captured','settled'), 'complete', 'open'), amt, 'USD',
        CONCAT('cs_demo_', MD5(i)), '192.168.1.1', 'Chrome', DATE_ADD(NOW(), INTERVAL 30 MINUTE),
        IF(st_status IN ('captured','settled'), NOW(), NULL));
    END IF;

    IF i MOD batch_size = 0 THEN COMMIT; END IF;
    SET i = i + 1;
  END WHILE;

  -- Webhook delivery samples
  INSERT INTO payment_webhook_deliveries (uuid, merchant_id, payment_intent_id, event_type, webhook_url, payload, status, attempt_count, delivered_at)
  SELECT UUID(), m_id, pi.id, 'payment.captured', 'https://api.demo.merchant/webhooks',
    JSON_OBJECT('intentRef', pi.intent_ref, 'amount', pi.amount_captured), 'delivered', 1, NOW()
  FROM payment_intents pi WHERE pi.status IN ('captured','settled') ORDER BY pi.id LIMIT 500;

END //
DELIMITER ;

CALL sp_seed_payment_gateway_demo();
DROP PROCEDURE IF EXISTS sp_seed_payment_gateway_demo;
