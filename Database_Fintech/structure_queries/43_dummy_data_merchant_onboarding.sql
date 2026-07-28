-- =============================================================================
-- 43_dummy_data_merchant_onboarding.sql
-- Demo merchant onboarding applications (20 records, mixed statuses)
-- =============================================================================

INSERT INTO permissions (id, uuid, code, name, module, description) VALUES
(72, 'p1000072-0000-4000-8000-000000000072', 'merchant_onboarding:read',    'View Merchant Onboarding',    'merchant_onboarding', 'List and view onboarding applications'),
(73, 'p1000073-0000-4000-8000-000000000073', 'merchant_onboarding:write',   'Manage Merchant Onboarding',  'merchant_onboarding', 'Create and edit onboarding applications'),
(74, 'p1000074-0000-4000-8000-000000000074', 'merchant_onboarding:approve', 'Approve Onboarding',          'merchant_onboarding', 'Approve merchant onboarding applications'),
(75, 'p1000075-0000-4000-8000-000000000075', 'merchant_onboarding:reject',  'Reject Onboarding',           'merchant_onboarding', 'Reject merchant onboarding applications'),
(76, 'p1000076-0000-4000-8000-000000000076', 'merchant_onboarding:suspend', 'Suspend Onboarding',          'merchant_onboarding', 'Suspend live merchants from onboarding')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO role_permissions (role_id, permission_id) VALUES
(1, 72), (1, 73), (1, 74), (1, 75), (1, 76),
(2, 72), (2, 73), (2, 74), (2, 75), (2, 76),
(5, 72), (5, 73), (5, 74), (5, 75), (5, 76)
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

INSERT INTO notification_events (uuid, code, name, category, description, is_enabled) VALUES
('ne000020-0000-4000-8000-000000000020', 'merchant_onboarding_submitted', 'Onboarding Submitted', 'merchant', 'Onboarding application submitted for review', 1),
('ne000021-0000-4000-8000-000000000021', 'merchant_onboarding_approved',  'Onboarding Approved',  'merchant', 'Onboarding application approved', 1),
('ne000022-0000-4000-8000-000000000022', 'merchant_onboarding_rejected',  'Onboarding Rejected',  'merchant', 'Onboarding application rejected', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO audit_actions (uuid, code, name, category_code, description, risk_level) VALUES
('aa000020-0000-4000-8000-000000000020', 'onboarding_create',  'Onboarding Created',  'merchants', 'Merchant onboarding application created', 'low'),
('aa000021-0000-4000-8000-000000000021', 'onboarding_submit',  'Onboarding Submitted','merchants', 'Merchant onboarding application submitted', 'low'),
('aa000022-0000-4000-8000-000000000022', 'onboarding_approve', 'Onboarding Approved', 'merchants', 'Merchant onboarding application approved', 'medium'),
('aa000023-0000-4000-8000-000000000023', 'onboarding_reject',  'Onboarding Rejected', 'merchants', 'Merchant onboarding application rejected', 'medium'),
('aa000024-0000-4000-8000-000000000024', 'onboarding_go_live', 'Merchant Go Live',     'merchants', 'Merchant went live from onboarding', 'high'),
('aa000025-0000-4000-8000-000000000025', 'onboarding_suspend', 'Onboarding Suspended','merchants', 'Live merchant suspended from onboarding', 'high')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO merchant_onboarding_applications
  (id, uuid, application_ref, organization_id, merchant_id, onboarding_status, current_step, rejection_reason, submitted_at, approved_at, rejected_at, go_live_at, created_by, updated_by, created_at) VALUES
(1,  'mo000001-0000-4000-8000-000000000001', 'MOB-2026-0001', 1, NULL, 'draft',         3, NULL, NULL, NULL, NULL, NULL, 1, 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2,  'mo000002-0000-4000-8000-000000000002', 'MOB-2026-0002', 1, NULL, 'draft',         1, NULL, NULL, NULL, NULL, NULL, 1, 1, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(3,  'mo000003-0000-4000-8000-000000000003', 'MOB-2026-0003', 2, NULL, 'submitted',     8, NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, NULL, NULL, 2, 2, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(4,  'mo000004-0000-4000-8000-000000000004', 'MOB-2026-0004', 2, NULL, 'submitted',     8, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, NULL, NULL, 2, 2, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(5,  'mo000005-0000-4000-8000-000000000005', 'MOB-2026-0005', 3, NULL, 'kyc_pending',   8, NULL, DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, NULL, NULL, 3, 3, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(6,  'mo000006-0000-4000-8000-000000000006', 'MOB-2026-0006', 3, NULL, 'kyc_pending',   8, NULL, DATE_SUB(NOW(), INTERVAL 4 DAY), NULL, NULL, NULL, 3, 3, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(7,  'mo000007-0000-4000-8000-000000000007', 'MOB-2026-0007', 4, NULL, 'under_review',  8, NULL, DATE_SUB(NOW(), INTERVAL 5 DAY), NULL, NULL, NULL, 4, 4, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(8,  'mo000008-0000-4000-8000-000000000008', 'MOB-2026-0008', 4, NULL, 'under_review',  8, NULL, DATE_SUB(NOW(), INTERVAL 6 DAY), NULL, NULL, NULL, 4, 4, DATE_SUB(NOW(), INTERVAL 11 DAY)),
(9,  'mo000009-0000-4000-8000-000000000009', 'MOB-2026-0009', 5, NULL, 'approved',      8, NULL, DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, NULL, 5, 1, DATE_SUB(NOW(), INTERVAL 14 DAY)),
(10, 'mo000010-0000-4000-8000-000000000010', 'MOB-2026-0010', 5, NULL, 'approved',      8, NULL, DATE_SUB(NOW(), INTERVAL 9 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY), NULL, NULL, 5, 1, DATE_SUB(NOW(), INTERVAL 15 DAY)),
(11, 'mo000011-0000-4000-8000-000000000011', 'MOB-2026-0011', 6, NULL, 'rejected',      8, 'Incomplete KYC documentation', DATE_SUB(NOW(), INTERVAL 12 DAY), NULL, DATE_SUB(NOW(), INTERVAL 5 DAY), NULL, 6, 1, DATE_SUB(NOW(), INTERVAL 18 DAY)),
(12, 'mo000012-0000-4000-8000-000000000012', 'MOB-2026-0012', 6, NULL, 'rejected',      8, 'Bank verification failed', DATE_SUB(NOW(), INTERVAL 13 DAY), NULL, DATE_SUB(NOW(), INTERVAL 6 DAY), NULL, 6, 1, DATE_SUB(NOW(), INTERVAL 19 DAY)),
(13, 'mo000013-0000-4000-8000-000000000013', 'MOB-2026-0013', 7, 1,  'go_live',         8, NULL, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, DATE_SUB(NOW(), INTERVAL 7 DAY), 7, 1, DATE_SUB(NOW(), INTERVAL 25 DAY)),
(14, 'mo000014-0000-4000-8000-000000000014', 'MOB-2026-0014', 7, 2,  'go_live',         8, NULL, DATE_SUB(NOW(), INTERVAL 22 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY), NULL, DATE_SUB(NOW(), INTERVAL 8 DAY), 7, 1, DATE_SUB(NOW(), INTERVAL 28 DAY)),
(15, 'mo000015-0000-4000-8000-000000000015', 'MOB-2026-0015', 8, 3,  'go_live',         8, NULL, DATE_SUB(NOW(), INTERVAL 24 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY), NULL, DATE_SUB(NOW(), INTERVAL 9 DAY), 8, 1, DATE_SUB(NOW(), INTERVAL 30 DAY)),
(16, 'mo000016-0000-4000-8000-000000000016', 'MOB-2026-0016', 1, 4,  'suspended',       8, NULL, DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 20 DAY), NULL, DATE_SUB(NOW(), INTERVAL 15 DAY), 1, 1, DATE_SUB(NOW(), INTERVAL 35 DAY)),
(17, 'mo000017-0000-4000-8000-000000000017', 'MOB-2026-0017', 2, NULL, 'inactive',      8, NULL, DATE_SUB(NOW(), INTERVAL 40 DAY), DATE_SUB(NOW(), INTERVAL 30 DAY), NULL, DATE_SUB(NOW(), INTERVAL 25 DAY), 2, 1, DATE_SUB(NOW(), INTERVAL 45 DAY)),
(18, 'mo000018-0000-4000-8000-000000000018', 'MOB-2026-0018', 3, NULL, 'draft',         5, NULL, NULL, NULL, NULL, NULL, 3, 3, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(19, 'mo000019-0000-4000-8000-000000000019', 'MOB-2026-0019', 4, NULL, 'submitted',     8, NULL, DATE_SUB(NOW(), INTERVAL 1 HOUR), NULL, NULL, NULL, 4, 4, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(20, 'mo000020-0000-4000-8000-000000000020', 'MOB-2026-0020', 5, NULL, 'under_review',  8, NULL, DATE_SUB(NOW(), INTERVAL 7 DAY), NULL, NULL, NULL, 5, 1, DATE_SUB(NOW(), INTERVAL 12 DAY));

INSERT INTO merchant_onboarding_business
  (application_id, business_name, legal_name, merchant_category, industry, website, email, phone, gst_number, pan_number, cin_number, business_type) VALUES
(1,  'QuickCart Retail', 'QuickCart Retail Pvt Ltd', 'E-Commerce', 'Retail', 'https://quickcart.example', 'ops@quickcart.example', '+91-9876543210', '27AABCU9603R1ZM', 'AABCU9603R', NULL, 'retail'),
(2,  'Nova SaaS', 'Nova SaaS Technologies LLP', 'Software', 'Technology', 'https://novasaas.example', 'hello@novasaas.example', '+91-9876543211', '29AADFN1234F1Z5', 'AADFN1234F', NULL, 'saas'),
(3,  'Helix Logistics', 'Helix Logistics India Pvt Ltd', 'Logistics', 'Transport', 'https://helixlog.example', 'contact@helixlog.example', '+91-9876543212', '07AAACH1234A1Z2', 'AAACH1234A', 'U12345MH2020PTC', 'logistics'),
(4,  'Pacific Wellness', 'Pacific Wellness Services Ltd', 'Healthcare', 'Health', 'https://pacificwell.example', 'info@pacificwell.example', '+91-9876543213', '33AAACP5678B1Z3', 'AAACP5678B', 'L56789KA2019PLC', 'healthcare'),
(5,  'Maple Fintech', 'Maple Fintech Solutions Pvt Ltd', 'Fintech', 'Finance', 'https://maplefintech.example', 'kyc@maplefintech.example', '+91-9876543214', '19AAACM9012C1Z4', 'AAACM9012C', NULL, 'fintech'),
(6,  'Saffron Foods', 'Saffron Foods & Beverages Pvt Ltd', 'Food & Beverage', 'F&B', 'https://saffronfoods.example', 'orders@saffronfoods.example', '+91-9876543215', '24AAACS3456D1Z5', 'AAACS3456D', NULL, 'retail'),
(7,  'Atlas Travel', 'Atlas Travel Agency Pvt Ltd', 'Travel', 'Tourism', 'https://atlastravel.example', 'bookings@atlastravel.example', '+91-9876543216', '36AAAAT7890E1Z6', 'AAAAT7890E', NULL, 'services'),
(8,  'Acme Consulting', 'Acme Business Consulting LLP', 'Consulting', 'Professional Services', 'https://acmeconsult.example', 'team@acmeconsult.example', '+91-9876543217', '09AAAAC2345F1Z7', 'AAAAC2345F', NULL, 'services'),
(9,  'ZenPay Retail', 'ZenPay Retail India Pvt Ltd', 'Payments', 'Retail', 'https://zenpay.example', 'support@zenpay.example', '+91-9876543218', '27AAACZ6789G1Z8', 'AAACZ6789G', NULL, 'fintech'),
(10, 'CloudNine Services', 'CloudNine IT Services Pvt Ltd', 'IT Services', 'Technology', 'https://cloudnine.example', 'sales@cloudnine.example', '+91-9876543219', '06AAACC0123H1Z9', 'AAACC0123H', 'U01234DL2018PTC', 'services'),
(11, 'Metro Mart', 'Metro Mart Retail Chain Pvt Ltd', 'Retail', 'Retail', 'https://metromart.example', 'ops@metromart.example', '+91-9876543220', '22AAACM4567I1Z0', 'AAACM4567I', NULL, 'retail'),
(12, 'BlueWave Digital', 'BlueWave Digital Media Pvt Ltd', 'Media', 'Digital', 'https://bluewave.example', 'hello@bluewave.example', '+91-9876543221', '32AAACB8901J1Z1', 'AAACB8901J', NULL, 'services'),
(13, 'Prime Electronics', 'Prime Electronics Trading Pvt Ltd', 'Electronics', 'Retail', 'https://primeelec.example', 'sales@primeelec.example', '+91-9876543222', '27AAACP2345K1Z2', 'AAACP2345K', NULL, 'retail'),
(14, 'GreenLeaf Organics', 'GreenLeaf Organics Pvt Ltd', 'Organic', 'Agriculture', 'https://greenleaf.example', 'info@greenleaf.example', '+91-9876543223', '29AAACG6789L1Z3', 'AAACG6789L', NULL, 'retail'),
(15, 'SwiftCargo', 'SwiftCargo Logistics Pvt Ltd', 'Logistics', 'Transport', 'https://swiftcargo.example', 'ops@swiftcargo.example', '+91-9876543224', '33AAACS0123M1Z4', 'AAACS0123M', 'U01234TN2017PTC', 'logistics'),
(16, 'UrbanStyle', 'UrbanStyle Fashion Pvt Ltd', 'Fashion', 'Retail', 'https://urbanstyle.example', 'contact@urbanstyle.example', '+91-9876543225', '07AAACU4567N1Z5', 'AAACU4567N', NULL, 'retail'),
(17, 'DataPulse Analytics', 'DataPulse Analytics Pvt Ltd', 'Analytics', 'Technology', 'https://datapulse.example', 'team@datapulse.example', '+91-9876543226', '19AAACD8901O1Z6', 'AAACD8901O', NULL, 'saas'),
(18, 'FreshBite Kitchen', 'FreshBite Kitchen Services Pvt Ltd', 'Food', 'F&B', 'https://freshbite.example', 'orders@freshbite.example', '+91-9876543227', '24AAACF2345P1Z7', 'AAACF2345P', NULL, 'services'),
(19, 'TechBridge Solutions', 'TechBridge Solutions Pvt Ltd', 'Software', 'Technology', 'https://techbridge.example', 'info@techbridge.example', '+91-9876543228', '36AAACT6789Q1Z8', 'AAACT6789Q', NULL, 'saas'),
(20, 'Royal Jewellers', 'Royal Jewellers & Co Pvt Ltd', 'Jewellery', 'Retail', 'https://royaljewellers.example', 'sales@royaljewellers.example', '+91-9876543229', '09AAACR0123R1Z9', 'AAACR0123R', NULL, 'retail');

INSERT INTO merchant_onboarding_addresses
  (uuid, application_id, address_type, line1, line2, country, state, city, pincode, latitude, longitude) VALUES
('moa00001-reg', 1, 'registered', '101 MG Road', 'Block A', 'India', 'Maharashtra', 'Mumbai', '400001', 19.076090, 72.877426),
('moa00001-op',  1, 'operating',  '101 MG Road', NULL, 'India', 'Maharashtra', 'Mumbai', '400001', 19.076090, 72.877426),
('moa00002-reg', 2, 'registered', '42 Tech Park', 'Floor 3', 'India', 'Karnataka', 'Bengaluru', '560001', 12.971599, 77.594566),
('moa00002-op',  2, 'operating',  '42 Tech Park', 'Floor 3', 'India', 'Karnataka', 'Bengaluru', '560001', 12.971599, 77.594566),
('moa00003-reg', 3, 'registered', '55 Industrial Area', NULL, 'India', 'Delhi', 'New Delhi', '110001', 28.613939, 77.209023),
('moa00003-op',  3, 'operating',  '55 Industrial Area', 'Warehouse 2', 'India', 'Delhi', 'New Delhi', '110001', 28.613939, 77.209023);

INSERT INTO merchant_onboarding_kyc_documents (uuid, application_id, document_type, file_name, file_size, mime_type, storage_path, uploaded_by) VALUES
('mokd00001-pan', 3, 'pan', 'pan_card.pdf', 245000, 'application/pdf', '/uploads/onboarding/3/pan_card.pdf', 2),
('mokd00001-gst', 3, 'gst_certificate', 'gst_cert.pdf', 312000, 'application/pdf', '/uploads/onboarding/3/gst_cert.pdf', 2),
('mokd00001-chq', 3, 'cancelled_cheque', 'cancelled_cheque.pdf', 189000, 'application/pdf', '/uploads/onboarding/3/cancelled_cheque.pdf', 2),
('mokd00002-pan', 5, 'pan', 'pan_card.pdf', 245000, 'application/pdf', '/uploads/onboarding/5/pan_card.pdf', 3),
('mokd00002-gst', 5, 'gst_certificate', 'gst_cert.pdf', 312000, 'application/pdf', '/uploads/onboarding/5/gst_cert.pdf', 3);

INSERT INTO merchant_onboarding_bank_details
  (application_id, account_holder, account_number_masked, ifsc, bank_name, branch, account_type, verification_status) VALUES
(3, 'Helix Logistics India Pvt Ltd', '****5678', 'HDFC0001234', 'HDFC Bank', 'Connaught Place', 'current', 'pending'),
(5, 'Maple Fintech Solutions Pvt Ltd', '****9012', 'ICIC0005678', 'ICICI Bank', 'Bandra West', 'current', 'verified'),
(7, 'Atlas Travel Agency Pvt Ltd', '****3456', 'SBIN0009012', 'State Bank of India', 'MG Road', 'current', 'verified'),
(9, 'ZenPay Retail India Pvt Ltd', '****7890', 'AXIS0003456', 'Axis Bank', 'Andheri East', 'current', 'verified');

INSERT INTO merchant_onboarding_settlement_config
  (application_id, settlement_cycle, settlement_currency, settlement_method, min_settlement_amount, reserve_pct, rolling_reserve_pct) VALUES
(3,  't1', 'INR', 'neft', 5000.00, 2.00, 5.00),
(5,  't0', 'INR', 'imps', 1000.00, 0.00, 0.00),
(7,  't2', 'INR', 'bank_transfer', 10000.00, 5.00, 10.00),
(9,  'weekly', 'INR', 'rtgs', 25000.00, 3.00, 7.50),
(10, 'monthly', 'INR', 'neft', 50000.00, 1.00, 2.00),
(13, 't1', 'INR', 'neft', 5000.00, 2.00, 5.00);

INSERT INTO merchant_onboarding_payment_config
  (application_id, enable_cards, enable_upi, enable_net_banking, enable_wallet, enable_emi, enable_bnpl, enable_qr, enable_payment_links, enable_subscriptions) VALUES
(3,  1, 1, 1, 1, 0, 0, 1, 1, 0),
(5,  1, 1, 1, 0, 1, 0, 0, 1, 1),
(7,  1, 1, 0, 1, 0, 0, 1, 0, 0),
(9,  1, 1, 1, 1, 1, 1, 1, 1, 1),
(10, 1, 0, 1, 0, 0, 0, 0, 1, 1),
(13, 1, 1, 1, 1, 0, 0, 1, 1, 0);

INSERT INTO merchant_onboarding_timeline_events (uuid, application_id, event_type, summary, actor_user_id, created_at) VALUES
('mote00001', 1,  'created',  'Onboarding application created', 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('mote00002', 3,  'created',  'Onboarding application created', 2, DATE_SUB(NOW(), INTERVAL 3 DAY)),
('mote00003', 3,  'submitted','Application submitted for review', 2, DATE_SUB(NOW(), INTERVAL 1 DAY)),
('mote00004', 5,  'submitted','Application submitted for review', 3, DATE_SUB(NOW(), INTERVAL 3 DAY)),
('mote00005', 5,  'kyc_pending', 'Moved to KYC pending', 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('mote00006', 7,  'under_review', 'Application under review', 1, DATE_SUB(NOW(), INTERVAL 4 DAY)),
('mote00007', 9,  'approved', 'Application approved', 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('mote00008', 11, 'rejected', 'Application rejected: Incomplete KYC documentation', 1, DATE_SUB(NOW(), INTERVAL 5 DAY)),
('mote00009', 13, 'go_live',  'Merchant went live', 1, DATE_SUB(NOW(), INTERVAL 7 DAY)),
('mote00010', 16, 'suspended','Merchant suspended', 1, DATE_SUB(NOW(), INTERVAL 3 DAY));
