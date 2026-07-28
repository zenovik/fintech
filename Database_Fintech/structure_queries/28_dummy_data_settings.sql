-- =============================================================================
-- 28_dummy_data_settings.sql
-- Settings seed data + permissions
-- =============================================================================

-- Singleton defaults
INSERT INTO organization_settings (id, uuid, legal_name, dba_name, tax_id, address_line1, city, state, postal_code, country, base_currency, timezone, primary_region, public_profile_enabled, payout_notifications_enabled, updated_by) VALUES
  (1, 'os100001-0000-4000-8000-000000000001', 'Merchant Pro Inc.', 'Merchant Pro', 'TAX-123456789', '100 Financial District Blvd', 'New York', 'NY', '10005', 'US', 'USD', 'America/New_York', 'North America', 1, 1, 1)
ON DUPLICATE KEY UPDATE legal_name = VALUES(legal_name);

INSERT INTO branding_settings (id, uuid, company_name, logo_initials, primary_color, secondary_color, accent_color, updated_by) VALUES
  (1, 'bs100001-0000-4000-8000-000000000001', 'Merchant Pro', 'MP', '#003ec7', '#1e40af', '#22c55e', 1)
ON DUPLICATE KEY UPDATE company_name = VALUES(company_name);

INSERT INTO security_settings (id, uuid, mfa_enforced, mfa_methods_allowed, ip_whitelist_enabled, ip_whitelist, updated_by) VALUES
  (1, 'ss100001-0000-4000-8000-000000000001', 0, JSON_ARRAY('totp', 'sms'), 0, JSON_ARRAY(), 1)
ON DUPLICATE KEY UPDATE mfa_enforced = VALUES(mfa_enforced);

INSERT INTO password_policy (id, uuid, min_length, require_uppercase, require_lowercase, require_number, require_special, max_age_days, history_count, updated_by) VALUES
  (1, 'pp100001-0000-4000-8000-000000000001', 8, 1, 1, 1, 1, 90, 5, 1)
ON DUPLICATE KEY UPDATE min_length = VALUES(min_length);

INSERT INTO session_settings (id, uuid, idle_timeout_minutes, max_session_duration_minutes, max_concurrent_sessions, remember_device_days, updated_by) VALUES
  (1, 'ses10001-0000-4000-8000-000000000001', 15, 480, 5, 30, 1)
ON DUPLICATE KEY UPDATE idle_timeout_minutes = VALUES(idle_timeout_minutes);

INSERT INTO api_settings (id, uuid, api_base_url, webhook_retry_count, webhook_timeout_seconds, rate_limit_per_minute, updated_by) VALUES
  (1, 'as100001-0000-4000-8000-000000000001', 'https://api.merchantpro.com/v1', 3, 30, 120, 1)
ON DUPLICATE KEY UPDATE api_base_url = VALUES(api_base_url);

INSERT INTO smtp_settings (id, uuid, host, port, username, from_email, from_name, use_tls, updated_by) VALUES
  (1, 'sm100001-0000-4000-8000-000000000001', 'smtp.merchantpro.com', 587, 'noreply@merchantpro.com', 'noreply@merchantpro.com', 'Merchant Pro', 1, 1)
ON DUPLICATE KEY UPDATE host = VALUES(host);

INSERT INTO storage_settings (id, uuid, provider, bucket_name, region, max_upload_mb, allowed_extensions, updated_by) VALUES
  (1, 'st100001-0000-4000-8000-000000000001', 'local', 'merchantpro-uploads', 'us-east-1', 10, JSON_ARRAY('pdf', 'png', 'jpg', 'jpeg', 'csv', 'xlsx'), 1)
ON DUPLICATE KEY UPDATE provider = VALUES(provider);

-- Feature flags
INSERT INTO feature_flags (id, uuid, code, name, description, is_enabled, is_beta, rollout_percentage, updated_by) VALUES
  (1, 'ff100001-0000-4000-8000-000000000001', 'advanced_analytics', 'Advanced Analytics', 'Enable advanced analytics dashboards and AI insights', 1, 0, 100, 1),
  (2, 'ff100002-0000-4000-8000-000000000002', 'bulk_settlements', 'Bulk Settlements', 'Allow batch settlement processing from the UI', 1, 0, 100, 1),
  (3, 'ff100003-0000-4000-8000-000000000003', 'payment_links', 'Payment Links', 'Enable payment link creation module', 0, 1, 25, 1),
  (4, 'ff100004-0000-4000-8000-000000000004', 'ai_fraud_detection', 'AI Fraud Detection', 'Machine-learning fraud scoring on transactions', 0, 1, 10, 1),
  (5, 'ff100005-0000-4000-8000-000000000005', 'developer_webhooks', 'Developer Webhooks', 'Expose webhook management in developer settings', 1, 0, 100, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- System default notification preferences (user_id NULL)
INSERT INTO notification_preferences (uuid, user_id, notification_type, channel, is_enabled) VALUES
  ('np100001-0000-4000-8000-000000000001', NULL, 'security_alerts', 'email', 1),
  ('np100002-0000-4000-8000-000000000002', NULL, 'security_alerts', 'push', 1),
  ('np100003-0000-4000-8000-000000000003', NULL, 'security_alerts', 'sms', 0),
  ('np100004-0000-4000-8000-000000000004', NULL, 'transaction_updates', 'email', 1),
  ('np100005-0000-4000-8000-000000000005', NULL, 'transaction_updates', 'push', 1),
  ('np100006-0000-4000-8000-000000000006', NULL, 'transaction_updates', 'sms', 0),
  ('np100007-0000-4000-8000-000000000007', NULL, 'settlement_reports', 'email', 1),
  ('np100008-0000-4000-8000-000000000008', NULL, 'settlement_reports', 'push', 0),
  ('np100009-0000-4000-8000-000000000009', NULL, 'settlement_reports', 'sms', 0),
  ('np100010-0000-4000-8000-000000000010', NULL, 'system_announcements', 'email', 1),
  ('np100011-0000-4000-8000-000000000011', NULL, 'system_announcements', 'push', 1),
  ('np100012-0000-4000-8000-000000000012', NULL, 'system_announcements', 'sms', 0)
ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled);

-- Admin user notification preferences
INSERT INTO notification_preferences (uuid, user_id, notification_type, channel, is_enabled) VALUES
  ('np200001-0000-4000-8000-000000000001', 1, 'security_alerts', 'email', 1),
  ('np200002-0000-4000-8000-000000000002', 1, 'security_alerts', 'push', 1),
  ('np200003-0000-4000-8000-000000000003', 1, 'security_alerts', 'sms', 1),
  ('np200004-0000-4000-8000-000000000004', 1, 'transaction_updates', 'email', 1),
  ('np200005-0000-4000-8000-000000000005', 1, 'transaction_updates', 'push', 1),
  ('np200006-0000-4000-8000-000000000006', 1, 'settlement_reports', 'email', 1),
  ('np200007-0000-4000-8000-000000000007', 1, 'system_announcements', 'email', 1)
ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled);

-- Settings permissions
INSERT INTO permissions (id, uuid, code, name, module, description) VALUES
  (25, 'p1000025-0000-4000-8000-000000000025', 'settings:read',  'View Settings',   'settings', 'View application and organization settings'),
  (26, 'p1000026-0000-4000-8000-000000000026', 'settings:write', 'Manage Settings', 'settings', 'Update application and organization settings')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Super Admin already has all via role; grant to Admin
INSERT INTO role_permissions (role_id, permission_id) VALUES (2, 25), (2, 26)
ON DUPLICATE KEY UPDATE granted_at = granted_at;

-- Operations Manager read-only settings
INSERT INTO role_permissions (role_id, permission_id) VALUES (4, 25)
ON DUPLICATE KEY UPDATE granted_at = granted_at;
