-- =============================================================================
-- 21_dummy_data_auth.sql
-- Authentication module dummy / UAT data
-- Default password for all seeded users: Password123!
-- bcrypt hash: $2b$12$0bMpMnbObtlR1uYKhzFewe.QcYrhnPcVmGfdpJt96vk8MBn38I43e
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
INSERT INTO users (
  id, uuid, email, password_hash, first_name, last_name, phone_number,
  phone_verified_at, email_verified_at, mfa_enabled, mfa_method, totp_secret,
  status, failed_login_attempts, locked_until, password_changed_at, last_login_at
) VALUES
(
  1, 'a1000001-0000-4000-8000-000000000001',
  'admin@merchantpro.com',
  '$2b$12$0bMpMnbObtlR1uYKhzFewe.QcYrhnPcVmGfdpJt96vk8MBn38I43e',
  'Alex', 'Rivera', '+14155554921',
  NOW(), NOW(), 0, 'none', NULL,
  'active', 0, NULL, DATE_SUB(NOW(), INTERVAL 45 DAY), DATE_SUB(NOW(), INTERVAL 2 MINUTE)
),
(
  2, 'a1000002-0000-4000-8000-000000000002',
  'mfa.totp@merchantpro.com',
  '$2b$12$0bMpMnbObtlR1uYKhzFewe.QcYrhnPcVmGfdpJt96vk8MBn38I43e',
  'Maria', 'Chen', '+14155555821',
  NOW(), NOW(), 1, 'totp', 'JBSWY3DPEHPK3PXP',
  'active', 0, NULL, DATE_SUB(NOW(), INTERVAL 30 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)
),
(
  3, 'a1000003-0000-4000-8000-000000000003',
  'locked.user@merchantpro.com',
  '$2b$12$0bMpMnbObtlR1uYKhzFewe.QcYrhnPcVmGfdpJt96vk8MBn38I43e',
  'James', 'Wilson', NULL,
  NULL, NOW(), 0, 'none', NULL,
  'locked', 5, DATE_ADD(NOW(), INTERVAL 25 MINUTE), DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 3 DAY)
),
(
  4, 'a1000004-0000-4000-8000-000000000004',
  'mfa.sms@merchantpro.com',
  '$2b$12$0bMpMnbObtlR1uYKhzFewe.QcYrhnPcVmGfdpJt96vk8MBn38I43e',
  'Sarah', 'Patel', '+14155554921',
  NOW(), NOW(), 1, 'sms', NULL,
  'active', 0, NULL, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 5 HOUR)
),
(
  5, 'a1000005-0000-4000-8000-000000000005',
  'sso.google@merchantpro.com',
  NULL,
  'David', 'Kim', '+14155551234',
  NOW(), NOW(), 0, 'none', NULL,
  'active', 0, NULL, NULL, DATE_SUB(NOW(), INTERVAL 12 HOUR)
);

-- ---------------------------------------------------------------------------
-- Password history
-- ---------------------------------------------------------------------------
INSERT INTO password_history (user_id, password_hash, created_at) VALUES
(1, '$2b$12$0bMpMnbObtlR1uYKhzFewe.QcYrhnPcVmGfdpJt96vk8MBn38I43e', DATE_SUB(NOW(), INTERVAL 45 DAY)),
(2, '$2b$12$0bMpMnbObtlR1uYKhzFewe.QcYrhnPcVmGfdpJt96vk8MBn38I43e', DATE_SUB(NOW(), INTERVAL 30 DAY));

-- ---------------------------------------------------------------------------
-- Trusted devices
-- ---------------------------------------------------------------------------
INSERT INTO trusted_devices (id, user_id, device_fingerprint, device_label, trusted_until, last_used_at) VALUES
(1, 1, 'fp_admin_chrome_london', 'MacBook Pro 16" - Chrome', DATE_ADD(NOW(), INTERVAL 30 DAY), NOW()),
(2, 2, 'fp_mfa_iphone_safari', 'iPhone 15 Pro - Safari', DATE_ADD(NOW(), INTERVAL 15 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY));

-- ---------------------------------------------------------------------------
-- User sessions
-- ---------------------------------------------------------------------------
INSERT INTO user_sessions (
  id, uuid, user_id, trusted_device_id, ip_address, user_agent,
  device_name, browser, os, location_city, location_country,
  status, last_activity_at, expires_at, trusted_until
) VALUES
(
  1, 'b2000001-0000-4000-8000-000000000001', 1, 1,
  '188.166.34.112', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/122.0.0',
  'MacBook Pro 16"', 'Chrome 122.0.0', 'macOS',
  'London', 'United Kingdom',
  'active', NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), DATE_ADD(NOW(), INTERVAL 30 DAY)
),
(
  2, 'b2000002-0000-4000-8000-000000000002', 1, NULL,
  '92.184.101.44', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1',
  'iPhone 15 Pro', 'Safari Mobile', 'iOS',
  'Paris', 'France',
  'active', DATE_SUB(NOW(), INTERVAL 14 MINUTE), DATE_ADD(NOW(), INTERVAL 7 DAY), NULL
),
(
  3, 'b2000003-0000-4000-8000-000000000003', 1, NULL,
  '81.102.12.98', 'MerchantApp/4.2.0 iPadOS',
  'iPad Air (5th Gen)', 'Merchant App', 'iPadOS',
  'Manchester', 'United Kingdom',
  'active', DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_ADD(NOW(), INTERVAL 7 DAY), NULL
),
(
  4, 'b2000004-0000-4000-8000-000000000004', 1, NULL,
  '104.167.24.201', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/121.0',
  'Workstation-DESKTOP-8892', 'Firefox 121.0', 'Windows',
  'New York', 'USA',
  'active', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 7 DAY), NULL
),
(
  5, 'b2000005-0000-4000-8000-000000000005', 2, 2,
  '203.0.113.10', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
  'iPhone 15 Pro', 'Safari Mobile', 'iOS',
  'San Francisco', 'USA',
  'active', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 7 DAY), DATE_ADD(NOW(), INTERVAL 30 DAY)
);

-- ---------------------------------------------------------------------------
-- SSO identities
-- ---------------------------------------------------------------------------
INSERT INTO sso_identities (user_id, provider, provider_user_id, email) VALUES
(5, 'google', 'google-oauth2|109876543210', 'sso.google@merchantpro.com');

-- ---------------------------------------------------------------------------
-- Auth audit logs (sample)
-- ---------------------------------------------------------------------------
INSERT INTO auth_audit_logs (user_id, session_id, event_type, ip_address, metadata, created_at) VALUES
(1, 1, 'login', '188.166.34.112', JSON_OBJECT('method', 'password'), DATE_SUB(NOW(), INTERVAL 2 MINUTE)),
(1, 1, 'session_created', '188.166.34.112', JSON_OBJECT('device', 'MacBook Pro 16"'), DATE_SUB(NOW(), INTERVAL 2 MINUTE)),
(2, 5, 'mfa_verify', '203.0.113.10', JSON_OBJECT('method', 'totp', 'success', true), DATE_SUB(NOW(), INTERVAL 1 DAY)),
(3, NULL, 'login_failed', '198.51.100.5', JSON_OBJECT('reason', 'account_locked'), DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(1, NULL, 'password_reset_requested', '188.166.34.112', JSON_OBJECT('email', 'admin@merchantpro.com'), DATE_SUB(NOW(), INTERVAL 10 DAY));
