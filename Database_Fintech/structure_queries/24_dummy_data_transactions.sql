-- =============================================================================
-- 24_dummy_data_transactions.sql
-- Transaction management seed data
-- =============================================================================

-- Additional transactions for list volume
INSERT INTO transactions (uuid, transaction_ref, merchant_id, customer_name, customer_email, description, amount, fee_amount, net_amount, currency, payment_method_type_id, payment_method_detail, status_id, region_id, is_high_value, processed_at, settled_at) VALUES
  ('t1000016-0000-4000-8000-000000000016', 'TXN-90284612', 9, 'Global Retail Customer', 'customer@globalretail.com', 'Online purchase', 3250.00, 78.75, 3171.25, 'USD', 1, 'Visa **** 8821', 1, 3, 0, NOW() - INTERVAL 1 HOUR, NOW() - INTERVAL 1 HOUR),
  ('t1000017-0000-4000-8000-000000000017', 'TXN-90284613', 8, 'Wei Lim', 'wei.lim@sgfintech.sg', 'API payment', 87500.00, 2187.50, 85312.50, 'SGD', 2, 'E-Wallet', 1, 3, 1, NOW() - INTERVAL 3 HOUR, NOW() - INTERVAL 2 HOUR),
  ('t1000018-0000-4000-8000-000000000018', 'TXN-90284614', 15, 'Stellar Client', 'client@stellarpayments.com', 'Recurring billing', 15600.00, 390.00, 15210.00, 'USD', 1, 'Mastercard **** 9912', 2, 1, 0, NOW() - INTERVAL 6 HOUR, NULL),
  ('t1000019-0000-4000-8000-000000000019', 'TXN-90284615', 4, 'UK Buyer Ltd', 'buyer@globallogistics.co.uk', 'Freight invoice', 67800.00, 1695.00, 66105.00, 'GBP', 4, 'Wire Transfer', 1, 2, 1, NOW() - INTERVAL 12 HOUR, NOW() - INTERVAL 10 HOUR),
  ('t1000020-0000-4000-8000-000000000020', 'TXN-90284616', 14, 'Suspended Merchant Txn', 'test@midwest.com', 'Blocked transaction', 5000.00, 125.00, 4875.00, 'USD', 1, 'Visa **** 0001', 3, 1, 0, NOW() - INTERVAL 1 DAY, NULL)
ON DUPLICATE KEY UPDATE customer_name = VALUES(customer_name);

-- Transaction events
INSERT INTO transaction_events (uuid, transaction_id, event_type, event_data) VALUES
  ('e1000001-0000-4000-8000-000000000001', 1, 'payment.initiated', '{"source":"api"}'),
  ('e1000002-0000-4000-8000-000000000002', 1, 'payment.authorized', '{"auth_code":"AUTH123"}'),
  ('e1000003-0000-4000-8000-000000000003', 1, 'payment.captured', '{"capture_id":"CAP456"}'),
  ('e1000004-0000-4000-8000-000000000004', 1, 'payment.settled', '{"settlement_id":"SET789"}'),
  ('e1000005-0000-4000-8000-000000000005', 2, 'payment.initiated', '{"source":"portal"}'),
  ('e1000006-0000-4000-8000-000000000006', 2, 'payment.pending', '{"reason":"bank_verification"}'),
  ('e1000007-0000-4000-8000-000000000007', 3, 'payment.initiated', '{"source":"api"}'),
  ('e1000008-0000-4000-8000-000000000008', 3, 'payment.failed', '{"reason":"insufficient_funds"}')
ON DUPLICATE KEY UPDATE event_type = VALUES(event_type);

-- Status history
INSERT INTO transaction_status_history (transaction_id, from_status_id, to_status_id, reason) VALUES
  (1, NULL, 1, 'Initial capture'),
  (2, NULL, 2, 'Awaiting bank confirmation'),
  (3, NULL, 3, 'Payment declined by issuer'),
  (4, NULL, 1, 'Apple Pay authorized'),
  (5, NULL, 1, 'Payment captured'),
  (7, NULL, 4, 'Flagged for review')
ON DUPLICATE KEY UPDATE reason = VALUES(reason);

-- Refunds
INSERT INTO transaction_refunds (uuid, transaction_id, merchant_id, customer_id, refund_ref, refund_type, amount, currency, reason, status, requested_by, approved_by, processed_at, created_by) VALUES
  ('r1000001-0000-4000-8000-000000000001', 12, 9, NULL, 'REF-88201', 'partial', 500.00, 'USD', 'Partial refund - damaged goods', 'processed', 1, 1, NOW() - INTERVAL 2 DAY, 1),
  ('r1000002-0000-4000-8000-000000000002', 13, 10, NULL, 'REF-88202', 'full', 890.50, 'USD', 'Full refund - customer request', 'processed', 1, 1, NOW() - INTERVAL 3 DAY, 1)
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- Fees breakdown
INSERT INTO transaction_fees (transaction_id, fee_type, amount, currency, description) VALUES
  (1, 'processing', 2490.00, 'USD', 'Card processing fee'),
  (1, 'platform', 622.50, 'USD', 'Platform fee'),
  (2, 'processing', 1784.01, 'USD', 'Wire transfer fee'),
  (2, 'platform', 446.00, 'USD', 'Platform fee'),
  (3, 'processing', 4240.00, 'USD', 'Card processing fee'),
  (3, 'platform', 1060.00, 'USD', 'Platform fee')
ON DUPLICATE KEY UPDATE amount = VALUES(amount);

-- Disputes / Chargebacks (customer_id set in optional_demo_seed.sql after customers seed)
INSERT INTO transaction_disputes (uuid, transaction_id, merchant_id, customer_id, dispute_ref, reason, reason_code, card_network, status, amount, currency, evidence_due_at, created_by) VALUES
  ('d1000001-0000-4000-8000-000000000001', 3, 3, NULL, 'CB-44001', 'Customer claims unauthorized charge', 'fraud', 'visa', 'open', 212000.00, 'USD', NOW() + INTERVAL 7 DAY, 1),
  ('d1000002-0000-4000-8000-000000000002', 7, 7, NULL, 'CB-44002', 'Product not received', 'product_not_received', 'mastercard', 'evidence_required', 210000.00, 'USD', NOW() + INTERVAL 3 DAY, 1),
  ('d1000003-0000-4000-8000-000000000003', 12, 9, NULL, 'CB-44003', 'Duplicate charge dispute', 'duplicate', 'visa', 'won', 2500.00, 'USD', NULL, 1)
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- Notes
INSERT INTO transaction_notes (uuid, transaction_id, note_text, is_internal) VALUES
  ('n2000001-0000-4000-8000-000000000001', 1, 'High-value transaction verified via manual review.', 1),
  ('n2000002-0000-4000-8000-000000000002', 3, 'Chargeback initiated - awaiting merchant response.', 1),
  ('n2000003-0000-4000-8000-000000000003', 7, 'Flagged transaction cleared after KYC check.', 1)
ON DUPLICATE KEY UPDATE note_text = VALUES(note_text);

-- Attachments
INSERT INTO transaction_attachments (uuid, transaction_id, file_name, file_url, mime_type) VALUES
  ('a2000001-0000-4000-8000-000000000001', 1, 'invoice_90284451.pdf', '/uploads/transactions/1/invoice.pdf', 'application/pdf'),
  ('a2000002-0000-4000-8000-000000000002', 3, 'dispute_evidence.pdf', '/uploads/transactions/3/dispute.pdf', 'application/pdf')
ON DUPLICATE KEY UPDATE file_name = VALUES(file_name);
