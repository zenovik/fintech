-- =============================================================================
-- 23_dummy_data_merchants.sql
-- Merchant management related seed data
-- =============================================================================

INSERT INTO merchant_tags (id, name, color) VALUES
  (1, 'Enterprise', 'primary'),
  (2, 'High Volume', 'secondary'),
  (3, 'New', 'green'),
  (4, 'At Risk', 'error'),
  (5, 'VIP', 'amber')
ON DUPLICATE KEY UPDATE color = VALUES(color);

INSERT INTO merchant_tag_assignments (merchant_id, tag_id) VALUES
  (1, 1), (1, 2), (4, 1), (4, 2), (8, 2), (8, 4), (9, 1), (9, 5),
  (10, 3), (14, 4), (15, 1), (15, 5)
ON DUPLICATE KEY UPDATE tag_id = VALUES(tag_id);

INSERT INTO merchant_addresses (uuid, merchant_id, address_type, line1, line2, city, state_province, postal_code, country_code, is_primary) VALUES
  ('a1000001-0000-4000-8000-000000000001', 1, 'registered', '1200 Commerce Blvd', 'Suite 400', 'Austin', 'TX', '78701', 'US', 1),
  ('a1000002-0000-4000-8000-000000000002', 2, 'registered', '45 Innovation Way', NULL, 'London', NULL, 'EC2A 4NE', 'GB', 1),
  ('a1000003-0000-4000-8000-000000000003', 4, 'registered', '88 Fleet Street', 'Floor 12', 'London', NULL, 'EC4Y 1DH', 'GB', 1),
  ('a1000004-0000-4000-8000-000000000004', 8, 'registered', '1 Raffles Place', '#20-01', 'Singapore', NULL, '048616', 'SG', 1),
  ('a1000005-0000-4000-8000-000000000005', 9, 'registered', '500 Market Street', NULL, 'San Francisco', 'CA', '94105', 'US', 1),
  ('a1000006-0000-4000-8000-000000000006', 10, 'registered', '22 Startup Lane', NULL, 'Berlin', NULL, '10115', 'DE', 1),
  ('a1000007-0000-4000-8000-000000000007', 15, 'registered', '200 Financial Plaza', 'Tower B', 'New York', 'NY', '10005', 'US', 1)
ON DUPLICATE KEY UPDATE line1 = VALUES(line1);

INSERT INTO merchant_contacts (uuid, merchant_id, contact_type, first_name, last_name, email, phone, job_title, is_primary) VALUES
  ('c1000001-0000-4000-8000-000000000001', 1, 'primary', 'Sarah', 'Chen', 'sarah.chen@velocityglobal.com', '+1-512-555-0101', 'CFO', 1),
  ('c1000002-0000-4000-8000-000000000002', 1, 'technical', 'James', 'Wu', 'james.wu@velocityglobal.com', '+1-512-555-0102', 'CTO', 0),
  ('c1000003-0000-4000-8000-000000000003', 4, 'primary', 'Michael', 'Thompson', 'm.thompson@globallogistics.co.uk', '+44-20-7946-0958', 'Managing Director', 1),
  ('c1000004-0000-4000-8000-000000000004', 8, 'primary', 'Wei', 'Lim', 'wei.lim@sgfintech.sg', '+65-6123-4567', 'CEO', 1),
  ('c1000005-0000-4000-8000-000000000005', 9, 'primary', 'Emily', 'Rodriguez', 'emily.r@globalretail.com', '+1-415-555-0199', 'VP Finance', 1),
  ('c1000006-0000-4000-8000-000000000006', 10, 'primary', 'Klaus', 'Müller', 'klaus@nexustrading.co', '+49-30-12345678', 'Founder', 1),
  ('c1000007-0000-4000-8000-000000000007', 15, 'primary', 'David', 'Park', 'david.park@stellarpayments.com', '+1-212-555-0177', 'COO', 1),
  ('c1000008-0000-4000-8000-000000000008', 15, 'billing', 'Lisa', 'Nguyen', 'billing@stellarpayments.com', '+1-212-555-0178', 'Accounts Payable', 0)
ON DUPLICATE KEY UPDATE email = VALUES(email);

INSERT INTO merchant_documents (uuid, merchant_id, document_type, file_name, file_url, status) VALUES
  ('d1000001-0000-4000-8000-000000000001', 1, 'certificate_of_incorporation', 'velocity_incorporation.pdf', '/uploads/merchants/1/incorporation.pdf', 'approved'),
  ('d1000002-0000-4000-8000-000000000002', 1, 'proof_of_address', 'velocity_address.pdf', '/uploads/merchants/1/address.pdf', 'approved'),
  ('d1000003-0000-4000-8000-000000000003', 4, 'certificate_of_incorporation', 'global_logistics_cert.pdf', '/uploads/merchants/4/cert.pdf', 'approved'),
  ('d1000004-0000-4000-8000-000000000004', 8, 'aml_policy', 'sgfintech_aml.pdf', '/uploads/merchants/8/aml.pdf', 'approved'),
  ('d1000005-0000-4000-8000-000000000005', 9, 'certificate_of_incorporation', 'grc_incorporation.pdf', '/uploads/merchants/9/incorporation.pdf', 'approved'),
  ('d1000006-0000-4000-8000-000000000006', 10, 'certificate_of_incorporation', 'nexus_cert.pdf', '/uploads/merchants/10/cert.pdf', 'pending'),
  ('d1000007-0000-4000-8000-000000000007', 10, 'proof_of_address', 'nexus_address.pdf', '/uploads/merchants/10/address.pdf', 'missing'),
  ('d1000008-0000-4000-8000-000000000008', 14, 'certificate_of_incorporation', 'midwest_cert.pdf', '/uploads/merchants/14/cert.pdf', 'rejected'),
  ('d1000009-0000-4000-8000-000000000009', 15, 'pci_compliance', 'stellar_pci.pdf', '/uploads/merchants/15/pci.pdf', 'approved')
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO merchant_bank_accounts (uuid, merchant_id, account_holder, bank_name, account_number_masked, iban, swift_bic, currency, is_primary) VALUES
  ('b1000001-0000-4000-8000-000000000001', 1, 'Velocity Global Ltd', 'Chase Bank', '****4521', NULL, 'CHASUS33', 'USD', 1),
  ('b1000002-0000-4000-8000-000000000002', 4, 'Global Logistics Ltd', 'Barclays', '****8834', 'GB82BARC20041512345678', 'BARCGB22', 'GBP', 1),
  ('b1000003-0000-4000-8000-000000000003', 8, 'Singapore FinTech Pte', 'DBS Bank', '****2290', NULL, 'DBSSSGSG', 'SGD', 1),
  ('b1000004-0000-4000-8000-000000000004', 9, 'Global Retail Corp', 'Wells Fargo', '****7712', NULL, 'WFBIUS6S', 'USD', 1),
  ('b1000005-0000-4000-8000-000000000005', 15, 'Stellar Payments Inc', 'Citibank', '****3398', NULL, 'CITIUS33', 'USD', 1)
ON DUPLICATE KEY UPDATE bank_name = VALUES(bank_name);

INSERT INTO merchant_settlement_accounts (uuid, merchant_id, bank_account_id, settlement_cycle, currency, is_active) VALUES
  ('s1000001-0000-4000-8000-000000000001', 1, 1, 'daily', 'USD', 1),
  ('s1000002-0000-4000-8000-000000000002', 4, 2, 'weekly', 'GBP', 1),
  ('s1000003-0000-4000-8000-000000000003', 8, 3, 'daily', 'SGD', 1),
  ('s1000004-0000-4000-8000-000000000004', 9, 4, 'daily', 'USD', 1),
  ('s1000005-0000-4000-8000-000000000005', 15, 5, 'daily', 'USD', 1)
ON DUPLICATE KEY UPDATE is_active = VALUES(is_active);

INSERT INTO merchant_payment_methods (merchant_id, payment_method_type_id, is_enabled) VALUES
  (1, 1, 1), (1, 2, 1), (1, 3, 1),
  (4, 1, 1), (4, 3, 1), (4, 4, 1),
  (8, 1, 1), (8, 2, 1), (8, 5, 1), (8, 6, 1),
  (9, 1, 1), (9, 2, 1), (9, 6, 1),
  (15, 1, 1), (15, 2, 1), (15, 3, 1), (15, 5, 1)
ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled);

INSERT INTO merchant_api_credentials (uuid, merchant_id, key_name, api_key_prefix, api_key_hash, environment, is_active, last_used_at) VALUES
  ('k1000001-0000-4000-8000-000000000001', 1, 'Production API Key', 'pk_live_', '$2b$10$velocityhashplaceholder000000000000000000000', 'production', 1, NOW() - INTERVAL 2 HOUR),
  ('k1000002-0000-4000-8000-000000000002', 1, 'Sandbox API Key', 'pk_test_', '$2b$10$velocitysandboxhashplaceholder000000000', 'sandbox', 1, NOW() - INTERVAL 1 DAY),
  ('k1000003-0000-4000-8000-000000000003', 4, 'Production API Key', 'pk_live_', '$2b$10$globalogisticshashplaceholder00000000000', 'production', 1, NOW() - INTERVAL 30 MINUTE),
  ('k1000004-0000-4000-8000-000000000004', 9, 'Production API Key', 'pk_live_', '$2b$10$globalretailhashplaceholder0000000000000', 'production', 1, NOW() - INTERVAL 5 MINUTE),
  ('k1000005-0000-4000-8000-000000000005', 15, 'Production API Key', 'pk_live_', '$2b$10$stellarpaymentshashplaceholder000000000', 'production', 1, NOW() - INTERVAL 1 HOUR)
ON DUPLICATE KEY UPDATE is_active = VALUES(is_active);

INSERT INTO merchant_webhooks (uuid, merchant_id, url, event_types, is_active) VALUES
  ('w1000001-0000-4000-8000-000000000001', 1, 'https://velocityglobal.com/webhooks/payments', '["payment.succeeded","payment.failed","settlement.completed"]', 1),
  ('w1000002-0000-4000-8000-000000000002', 4, 'https://api.globallogistics.co.uk/hooks/pay', '["payment.succeeded","refund.created"]', 1),
  ('w1000003-0000-4000-8000-000000000003', 9, 'https://globalretail.com/api/v1/webhooks', '["payment.succeeded","payment.failed","chargeback.opened"]', 1)
ON DUPLICATE KEY UPDATE url = VALUES(url);

INSERT INTO merchant_notes (uuid, merchant_id, note_text, is_internal) VALUES
  ('n1000001-0000-4000-8000-000000000001', 1, 'Annual compliance review completed. All documents verified.', 1),
  ('n1000002-0000-4000-8000-000000000002', 8, 'Elevated risk due to high transaction velocity in APAC region. Monitoring closely.', 1),
  ('n1000003-0000-4000-8000-000000000003', 10, 'Onboarding in progress. Awaiting proof of address document.', 1),
  ('n1000004-0000-4000-8000-000000000004', 14, 'Account suspended due to failed KYC re-verification. Contact compliance team.', 1),
  ('n1000005-0000-4000-8000-000000000005', 15, 'VIP merchant — priority support channel enabled.', 1)
ON DUPLICATE KEY UPDATE note_text = VALUES(note_text);
