-- =============================================================================
-- 31_dummy_data_organizations.sql
-- Organizations seed data + RBAC permissions
-- =============================================================================

USE fintech_db;

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
INSERT INTO permissions (id, uuid, code, name, module, description) VALUES
  (33, 'p1000033-0000-4000-8000-000000000033', 'organizations:read',   'View Organizations',   'organizations', 'View organizations and related resources'),
  (34, 'p1000034-0000-4000-8000-000000000034', 'organizations:write',  'Manage Organizations', 'organizations', 'Create and update organizations'),
  (35, 'p1000035-0000-4000-8000-000000000035', 'organizations:delete', 'Delete Organizations', 'organizations', 'Archive and delete organizations'),
  (36, 'p1000036-0000-4000-8000-000000000036', 'organizations:manage', 'Administer Org Resources', 'organizations', 'Manage members, domains, API keys, billing')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
  (2, 33, 1), (2, 34, 1), (2, 35, 1), (2, 36, 1);

INSERT IGNORE INTO role_permissions (role_id, permission_id, granted_by) VALUES
  (4, 33, 1);

-- ---------------------------------------------------------------------------
-- System org role templates (organization_id NULL)
-- ---------------------------------------------------------------------------
INSERT INTO organization_roles (id, uuid, organization_id, code, name, description, is_system) VALUES
  (1, 'or000001-0000-4000-8000-000000000001', NULL, 'owner',  'Owner',  'Full control of the organization', 1),
  (2, 'or000002-0000-4000-8000-000000000002', NULL, 'admin',  'Admin',  'Manage members and settings', 1),
  (3, 'or000003-0000-4000-8000-000000000003', NULL, 'member', 'Member', 'Standard organization member', 1),
  (4, 'or000004-0000-4000-8000-000000000004', NULL, 'viewer', 'Viewer', 'Read-only access', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ---------------------------------------------------------------------------
-- Organizations
-- ---------------------------------------------------------------------------
INSERT INTO organizations (id, uuid, code, legal_name, display_name, dba_name, tax_id, industry, website, status, logo_initials, primary_color, base_currency, timezone, locale, primary_region, description, created_by) VALUES
  (1, 'og000001-0000-4000-8000-000000000001', 'merchant-pro', 'Merchant Pro Inc.', 'Merchant Pro', 'Merchant Pro', 'US-88-1234567', 'Financial Services', 'https://merchantpro.com', 'active', 'MP', '#003ec7', 'USD', 'America/New_York', 'en-US', 'North America', 'Primary enterprise payment gateway organization.', 1),
  (2, 'og000002-0000-4000-8000-000000000002', 'acme-financial', 'Acme Financial Solutions Ltd.', 'Acme Financial', 'Acme Pay', 'GB 123 4567 89', 'Financial Services', 'https://acmefinancial.example', 'active', 'AF', '#0f766e', 'GBP', 'Europe/London', 'en-GB', 'Europe', 'European partner organization.', 1),
  (3, 'og000003-0000-4000-8000-000000000003', 'nova-commerce', 'Nova Commerce Pte Ltd', 'Nova Commerce', NULL, 'SG-201234567A', 'E-commerce', 'https://novacommerce.example', 'pending', 'NC', '#7c3aed', 'SGD', 'Asia/Singapore', 'en-SG', 'Asia Pacific', 'APAC merchant aggregation tenant.', 1)
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

INSERT INTO organization_addresses (id, uuid, organization_id, address_type, line1, line2, city, state_province, postal_code, country_code, is_primary) VALUES
  (1, 'oa000001-0000-4000-8000-000000000001', 1, 'registered', '100 Market Street', 'Suite 400', 'San Francisco', 'CA', '94105', 'US', 1),
  (2, 'oa000002-0000-4000-8000-000000000002', 1, 'billing', '100 Market Street', 'Suite 400', 'San Francisco', 'CA', '94105', 'US', 0),
  (3, 'oa000003-0000-4000-8000-000000000003', 2, 'registered', '12-14 High Street', 'Canary Wharf', 'London', NULL, 'E14 5AB', 'GB', 1),
  (4, 'oa000004-0000-4000-8000-000000000004', 3, 'registered', '1 Raffles Place', '#20-01', 'Singapore', NULL, '048616', 'SG', 1)
ON DUPLICATE KEY UPDATE line1 = VALUES(line1);

INSERT INTO organization_contacts (id, uuid, organization_id, contact_type, first_name, last_name, email, phone, job_title, is_primary) VALUES
  (1, 'oc000001-0000-4000-8000-000000000001', 1, 'primary', 'Alex', 'Rivera', 'admin@merchantpro.com', '+1-415-555-0100', 'Platform Admin', 1),
  (2, 'oc000002-0000-4000-8000-000000000002', 1, 'billing', 'Sam', 'Chen', 'billing@merchantpro.com', '+1-415-555-0101', 'Finance Lead', 0),
  (3, 'oc000003-0000-4000-8000-000000000003', 2, 'primary', 'Elena', 'Jenkins', 'elena@acmefinancial.example', '+44-20-7946-0958', 'Director', 1),
  (4, 'oc000004-0000-4000-8000-000000000004', 3, 'primary', 'Wei', 'Tan', 'wei@novacommerce.example', '+65-6123-4567', 'Founder', 1)
ON DUPLICATE KEY UPDATE email = VALUES(email);

INSERT INTO organization_domains (id, uuid, organization_id, domain, is_primary, is_verified, status, verified_at) VALUES
  (1, 'od000001-0000-4000-8000-000000000001', 1, 'merchantpro.com', 1, 1, 'verified', NOW(6)),
  (2, 'od000002-0000-4000-8000-000000000002', 1, 'app.merchantpro.com', 0, 1, 'verified', NOW(6)),
  (3, 'od000003-0000-4000-8000-000000000003', 2, 'acmefinancial.example', 1, 1, 'verified', NOW(6)),
  (4, 'od000004-0000-4000-8000-000000000004', 3, 'novacommerce.example', 1, 0, 'pending', NULL)
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO organization_members (id, uuid, organization_id, user_id, org_role_id, status, is_default, invited_by, joined_at) VALUES
  (1, 'om000001-0000-4000-8000-000000000001', 1, 1, 1, 'active', 1, NULL, NOW(6)),
  (2, 'om000002-0000-4000-8000-000000000002', 2, 1, 2, 'active', 0, NULL, NOW(6)),
  (3, 'om000003-0000-4000-8000-000000000003', 1, 2, 2, 'active', 1, 1, NOW(6)),
  (4, 'om000004-0000-4000-8000-000000000004', 3, 1, 1, 'active', 0, NULL, NOW(6))
ON DUPLICATE KEY UPDATE status = VALUES(status);

INSERT INTO organization_branding (id, uuid, organization_id, company_name, logo_url, logo_initials, primary_color, secondary_color, accent_color, updated_by) VALUES
  (1, 'ob000001-0000-4000-8000-000000000001', 1, 'Merchant Pro', NULL, 'MP', '#003ec7', '#1e40af', '#22c55e', 1),
  (2, 'ob000002-0000-4000-8000-000000000002', 2, 'Acme Financial', NULL, 'AF', '#0f766e', '#115e59', '#f59e0b', 1),
  (3, 'ob000003-0000-4000-8000-000000000003', 3, 'Nova Commerce', NULL, 'NC', '#7c3aed', '#5b21b6', '#06b6d4', 1)
ON DUPLICATE KEY UPDATE company_name = VALUES(company_name);

INSERT INTO organization_preferences (id, uuid, organization_id, pref_key, pref_value, updated_by) VALUES
  (1, 'op000001-0000-4000-8000-000000000001', 1, 'automatic_invoicing', 'true', 1),
  (2, 'op000002-0000-4000-8000-000000000002', 1, 'payout_notifications', 'true', 1),
  (3, 'op000003-0000-4000-8000-000000000003', 1, 'public_profile', 'false', 1),
  (4, 'op000004-0000-4000-8000-000000000004', 2, 'automatic_invoicing', 'true', 1),
  (5, 'op000005-0000-4000-8000-000000000005', 2, 'payout_notifications', 'true', 1)
ON DUPLICATE KEY UPDATE pref_value = VALUES(pref_value);

INSERT INTO organization_api_keys (id, uuid, organization_id, name, key_prefix, key_hash, environment, status, last_used_at, created_by) VALUES
  (1, 'ok000001-0000-4000-8000-000000000001', 1, 'Live Key', 'pk_live_', SHA2('pk_live_demo_merchant_pro_key_001', 256), 'live', 'active', DATE_SUB(NOW(6), INTERVAL 2 HOUR), 1),
  (2, 'ok000002-0000-4000-8000-000000000002', 1, 'Test Key', 'pk_test_', SHA2('pk_test_demo_merchant_pro_key_001', 256), 'test', 'active', DATE_SUB(NOW(6), INTERVAL 1 DAY), 1),
  (3, 'ok000003-0000-4000-8000-000000000003', 2, 'Live Key', 'pk_live_', SHA2('pk_live_demo_acme_key_001', 256), 'live', 'active', NULL, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO organization_billing (id, uuid, organization_id, plan_code, plan_name, billing_email, billing_cycle, status, currency, amount, next_billing_at, payment_method_last4, payment_method_brand, updated_by) VALUES
  (1, 'obil0001-0000-4000-8000-000000000001', 1, 'enterprise', 'Enterprise', 'billing@merchantpro.com', 'monthly', 'active', 'USD', 2499.00, DATE_ADD(CURDATE(), INTERVAL 18 DAY), '4242', 'Visa', 1),
  (2, 'obil0002-0000-4000-8000-000000000002', 2, 'growth', 'Growth', 'billing@acmefinancial.example', 'yearly', 'active', 'GBP', 12000.00, DATE_ADD(CURDATE(), INTERVAL 90 DAY), '5555', 'Mastercard', 1),
  (3, 'obil0003-0000-4000-8000-000000000003', 3, 'starter', 'Starter', 'billing@novacommerce.example', 'monthly', 'trialing', 'SGD', 0.00, DATE_ADD(CURDATE(), INTERVAL 14 DAY), NULL, NULL, 1)
ON DUPLICATE KEY UPDATE plan_name = VALUES(plan_name);

-- Audit category for organizations (extend audit seed if table exists)
INSERT INTO audit_categories (id, uuid, code, name, description, icon, sort_order) VALUES
  (11, 'ac00000b-0000-4000-8000-00000000000b', 'organizations', 'Organizations', 'Organization lifecycle and membership', 'corporate_fare', 11)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO audit_actions (id, uuid, code, name, category_code, description, risk_level) VALUES
  (22, 'aa000016-0000-4000-8000-000000000016', 'org_create',  'Create Organization',  'organizations', 'Organization created', 'low'),
  (23, 'aa000017-0000-4000-8000-000000000017', 'org_update',  'Update Organization',  'organizations', 'Organization updated', 'low'),
  (24, 'aa000018-0000-4000-8000-000000000018', 'org_archive', 'Archive Organization', 'organizations', 'Organization archived', 'medium'),
  (25, 'aa000019-0000-4000-8000-000000000019', 'org_restore', 'Restore Organization', 'organizations', 'Organization restored', 'low')
ON DUPLICATE KEY UPDATE name = VALUES(name);
