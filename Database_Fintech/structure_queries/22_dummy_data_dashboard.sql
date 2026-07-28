-- =============================================================================
-- 22_dummy_data_dashboard.sql
-- Lookup tables and dashboard infrastructure only.
-- Enterprise volume data: 50_enterprise_demo_data.sql (npm run db:generate-enterprise)
-- =============================================================================

INSERT INTO regions (id, code, name, display_order) VALUES
  (1, 'NA', 'North America', 1),
  (2, 'EMEA', 'EMEA', 2),
  (3, 'APAC', 'APAC', 3)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO payment_method_types (id, code, name, icon_key) VALUES
  (1, 'credit_card', 'Credit Cards', 'credit_card'),
  (2, 'e_wallet', 'UPI / E-Wallets', 'account_balance_wallet'),
  (3, 'bank_transfer', 'Bank Transfers', 'account_balance'),
  (4, 'wire', 'Wire Transfer', 'account_balance'),
  (5, 'digital_wallet', 'Digital Wallet', 'account_balance_wallet'),
  (6, 'apple_pay', 'Apple Pay', 'account_balance_wallet')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO transaction_statuses (id, code, label, badge_color, display_order) VALUES
  (1, 'settled', 'Settled', 'green', 1),
  (2, 'pending', 'Pending', 'amber', 2),
  (3, 'failed', 'Failed', 'red', 3),
  (4, 'flagged', 'Flagged', 'error', 4)
ON DUPLICATE KEY UPDATE label = VALUES(label);

INSERT INTO activity_event_types (id, code, name, icon_key, color_token) VALUES
  (1, 'merchant_onboarded', 'Merchant Onboarded', 'person_add', 'primary'),
  (2, 'settlement_processed', 'Settlement Processed', 'paid', 'green'),
  (3, 'risk_alert', 'Risk Alert', 'shield', 'amber'),
  (4, 'system_update', 'System Update', 'settings', 'primary')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO fraud_alert_severities (id, code, label, color_token, display_order) VALUES
  (1, 'low', 'Low', 'outline', 1),
  (2, 'medium', 'Medium', 'amber', 2),
  (3, 'high', 'High', 'error', 3),
  (4, 'critical', 'Critical', 'error', 4)
ON DUPLICATE KEY UPDATE label = VALUES(label);

INSERT INTO dashboard_export_formats (id, code, name, mime_type) VALUES
  (1, 'csv', 'CSV', 'text/csv'),
  (2, 'xlsx', 'Excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
  (3, 'pdf', 'PDF', 'application/pdf')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- User dashboard preferences (admin user from auth seed; recreated in enterprise seed if truncated)
INSERT INTO user_dashboard_preferences (user_id, default_date_range, high_value_threshold, table_page_size)
SELECT id, 'monthly', 5000.00, 25 FROM users WHERE email = 'admin@merchantpro.com' LIMIT 1
ON DUPLICATE KEY UPDATE default_date_range = VALUES(default_date_range);
