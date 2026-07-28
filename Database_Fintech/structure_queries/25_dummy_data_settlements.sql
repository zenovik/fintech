-- =============================================================================
-- 25_dummy_data_settlements.sql
-- Settlement management seed data
-- =============================================================================

INSERT INTO settlement_batches (id, uuid, batch_ref, status, total_amount, settlement_count, currency, processed_at) VALUES
  (1, 'b2000001-0000-4000-8000-000000000001', 'BATCH-2024-001', 'completed', 2810000.00, 3, 'USD', NOW() - INTERVAL 45 MINUTE),
  (2, 'b2000002-0000-4000-8000-000000000002', 'BATCH-2024-002', 'completed', 890000.00, 1, 'USD', NOW() - INTERVAL 2 DAY),
  (3, 'b2000003-0000-4000-8000-000000000003', 'BATCH-2024-003', 'processing', 1250000.00, 2, 'USD', NULL)
ON DUPLICATE KEY UPDATE total_amount = VALUES(total_amount);

INSERT INTO settlements (id, uuid, settlement_ref, merchant_id, batch_id, gross_amount, fee_amount, adjustment_amount, amount, currency, status, settlement_cycle, scheduled_at, processed_at, bank_transfer_ref) VALUES
  (1, 's1000001-0000-4000-8000-000000000001', 'XJ-9221', 9, 1, 1450000.00, 50000.00, 0.00, 1400000.00, 'USD', 'processed', 'daily', NOW() - INTERVAL 2 HOUR, NOW() - INTERVAL 45 MINUTE, 'BT-882910'),
  (2, 's1000002-0000-4000-8000-000000000002', 'XJ-9220', 4, 2, 920000.00, 30000.00, 0.00, 890000.00, 'USD', 'processed', 'weekly', NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 2 DAY, 'BT-882911'),
  (3, 's1000003-0000-4000-8000-000000000003', 'XJ-9219', 1, 1, 540000.00, 20000.00, 0.00, 520000.00, 'USD', 'processed', 'daily', NOW() - INTERVAL 4 DAY, NOW() - INTERVAL 3 DAY, 'BT-882912'),
  (4, 's1000004-0000-4000-8000-000000000004', 'XJ-9218', 15, 3, 750000.00, 25000.00, 0.00, 725000.00, 'USD', 'processing', 'daily', NOW() - INTERVAL 1 HOUR, NULL, NULL),
  (5, 's1000005-0000-4000-8000-000000000005', 'XJ-9217', 8, 3, 540000.00, 15000.00, 0.00, 525000.00, 'SGD', 'pending', 'daily', NOW() + INTERVAL 6 HOUR, NULL, NULL),
  (6, 's1000006-0000-4000-8000-000000000006', 'XJ-9216', 4, NULL, 125000.00, 4000.00, -2500.00, 118500.00, 'USD', 'processed', 'weekly', NOW() - INTERVAL 7 DAY, NOW() - INTERVAL 6 DAY, 'BT-882913'),
  (7, 's1000007-0000-4000-8000-000000000007', 'XJ-9215', 12, NULL, 180000.00, 6000.00, 0.00, 174000.00, 'USD', 'failed', 'daily', NOW() - INTERVAL 1 DAY, NULL, NULL),
  (8, 's1000008-0000-4000-8000-000000000008', 'XJ-9214', 6, NULL, 95000.00, 3000.00, 0.00, 92000.00, 'USD', 'pending', 'daily', NOW() + INTERVAL 12 HOUR, NULL, NULL)
ON DUPLICATE KEY UPDATE amount = VALUES(amount), status = VALUES(status);

INSERT INTO settlement_transactions (settlement_id, transaction_id, amount) VALUES
  (1, 9, 156000.00), (1, 16, 3250.00),
  (2, 1, 124500.00), (2, 12, 2500.00),
  (3, 5, 142500.00),
  (4, 11, 198000.00),
  (6, 1, 124500.00)
ON DUPLICATE KEY UPDATE amount = VALUES(amount);

INSERT INTO settlement_adjustments (uuid, settlement_id, adjustment_type, amount, currency, reason) VALUES
  ('adj10001-0000-4000-8000-000000000001', 6, 'debit', 2500.00, 'USD', 'Chargeback reserve hold'),
  ('adj10002-0000-4000-8000-000000000002', 1, 'credit', 5000.00, 'USD', 'Promotional fee waiver')
ON DUPLICATE KEY UPDATE reason = VALUES(reason);

INSERT INTO settlement_fees (settlement_id, fee_type, amount, currency, description) VALUES
  (1, 'processing', 35000.00, 'USD', 'Card processing fees'),
  (1, 'platform', 15000.00, 'USD', 'Platform settlement fee'),
  (2, 'processing', 22000.00, 'USD', 'Wire transfer fees'),
  (2, 'platform', 8000.00, 'USD', 'Platform fee'),
  (3, 'processing', 14000.00, 'USD', 'Processing fees'),
  (3, 'platform', 6000.00, 'USD', 'Platform fee')
ON DUPLICATE KEY UPDATE amount = VALUES(amount);

INSERT INTO settlement_bank_transfers (uuid, settlement_id, bank_name, account_masked, transfer_ref, amount, currency, status, sent_at, confirmed_at) VALUES
  ('bt100001-0000-4000-8000-000000000001', 1, 'Wells Fargo', '****7712', 'BT-882910', 1400000.00, 'USD', 'confirmed', NOW() - INTERVAL 50 MINUTE, NOW() - INTERVAL 45 MINUTE),
  ('bt100002-0000-4000-8000-000000000002', 2, 'Barclays', '****8834', 'BT-882911', 890000.00, 'USD', 'confirmed', NOW() - INTERVAL 2 DAY, NOW() - INTERVAL 2 DAY),
  ('bt100003-0000-4000-8000-000000000003', 3, 'Chase Bank', '****4521', 'BT-882912', 520000.00, 'USD', 'confirmed', NOW() - INTERVAL 3 DAY, NOW() - INTERVAL 3 DAY),
  ('bt100004-0000-4000-8000-000000000004', 6, 'Barclays', '****8834', 'BT-882913', 118500.00, 'USD', 'confirmed', NOW() - INTERVAL 6 DAY, NOW() - INTERVAL 6 DAY)
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO settlement_status_history (settlement_id, from_status, to_status, reason) VALUES
  (1, NULL, 'pending', 'Settlement created'),
  (1, 'pending', 'processing', 'Batch processing started'),
  (1, 'processing', 'processed', 'Bank transfer confirmed'),
  (2, NULL, 'pending', 'Settlement created'),
  (2, 'pending', 'processed', 'Weekly settlement processed'),
  (4, NULL, 'pending', 'Settlement scheduled'),
  (4, 'pending', 'processing', 'Included in batch BATCH-2024-003'),
  (7, NULL, 'pending', 'Settlement created'),
  (7, 'pending', 'failed', 'Bank transfer rejected - invalid account')
ON DUPLICATE KEY UPDATE reason = VALUES(reason);

INSERT INTO settlement_notes (uuid, settlement_id, note_text, is_internal) VALUES
  ('sn100001-0000-4000-8000-000000000001', 1, 'High-value settlement verified and approved.', 1),
  ('sn100002-0000-4000-8000-000000000002', 7, 'Failed due to expired bank account details. Merchant notified.', 1),
  ('sn100003-0000-4000-8000-000000000003', 4, 'Awaiting batch completion.', 1)
ON DUPLICATE KEY UPDATE note_text = VALUES(note_text);

-- Activity events (requires settlements to exist first)
INSERT INTO activity_events (uuid, event_type_id, title, description, actor_user_id, merchant_id, settlement_id, occurred_at) VALUES
  ('a1000001-0000-4000-8000-000000000001', 1, 'Merchant Onboarded', 'Global Retail Corp completed onboarding for APAC region.', NULL, 9, NULL, NOW() - INTERVAL 2 MINUTE),
  ('a1000002-0000-4000-8000-000000000002', 2, 'Settlement Processed', 'Settlement #XJ-9221 worth $1.4M processed successfully.', NULL, 9, 1, NOW() - INTERVAL 45 MINUTE),
  ('a1000003-0000-4000-8000-000000000003', 3, 'Risk Alert', 'Suspicious login attempt from unknown IP (92.112.x.x).', 1, NULL, NULL, NOW() - INTERVAL 3 HOUR),
  ('a1000004-0000-4000-8000-000000000004', 4, 'System Update', 'System update scheduled for maintenance window 2AM-4AM UTC.', NULL, NULL, NULL, NOW() - INTERVAL 1 DAY),
  ('a1000005-0000-4000-8000-000000000005', 1, 'Merchant Onboarded', 'Stellar Payments completed onboarding for North America.', NULL, 15, NULL, NOW() - INTERVAL 2 DAY),
  ('a1000006-0000-4000-8000-000000000006', 2, 'Settlement Processed', 'Settlement #XJ-9220 worth $890K processed successfully.', NULL, 4, 2, NOW() - INTERVAL 2 DAY)
ON DUPLICATE KEY UPDATE description = VALUES(description);
