-- =============================================================================
-- 44_dummy_data_merchant_hierarchy.sql
-- Permissions, merchant roles, state-region mapping, audit/notification events
-- =============================================================================

INSERT INTO permissions (id, uuid, code, name, module, description) VALUES
(77, 'p1000077-0000-4000-8000-000000000077', 'outlets:read',         'View Outlets',         'outlets',         'List and view merchant outlets'),
(78, 'p1000078-0000-4000-8000-000000000078', 'outlets:write',        'Manage Outlets',       'outlets',         'Create and edit merchant outlets'),
(79, 'p1000079-0000-4000-8000-000000000079', 'outlets:manage',       'Administer Outlets',   'outlets',         'Activate, deactivate outlets'),
(80, 'p1000080-0000-4000-8000-000000000080', 'merchant_users:read',  'View Merchant Users',  'merchant_users',  'List merchant portal users'),
(81, 'p1000081-0000-4000-8000-000000000081', 'merchant_users:write', 'Manage Merchant Users','merchant_users',  'Create and edit merchant users'),
(82, 'p1000082-0000-4000-8000-000000000082', 'merchant_users:manage','Admin Merchant Users', 'merchant_users',  'Invite, roles, outlet access')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO role_permissions (role_id, permission_id) VALUES
(1, 77), (1, 78), (1, 79), (1, 80), (1, 81), (1, 82),
(2, 77), (2, 78), (2, 79), (2, 80), (2, 81), (2, 82),
(5, 77), (5, 78), (5, 79), (5, 80), (5, 81), (5, 82)
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

INSERT INTO merchant_roles (id, code, name, description) VALUES
(1, 'merchant_owner',       'Merchant Owner',       'Full merchant portal access'),
(2, 'merchant_admin',       'Merchant Admin',       'Manage outlets, users, and operations'),
(3, 'finance_manager',      'Finance Manager',      'Finance and settlement access'),
(4, 'accountant',           'Accountant',           'Financial reporting access'),
(5, 'operations_manager',   'Operations Manager',   'Operations and outlet oversight'),
(6, 'branch_manager',       'Branch Manager',       'Assigned outlet operations'),
(7, 'support_executive',    'Support Executive',    'Customer and transaction support'),
(8, 'viewer',               'Viewer',               'Read-only merchant access')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO merchant_role_permissions (merchant_role_id, permission_id) VALUES
-- Merchant Owner / Admin
(1, 1), (1, 2), (1, 77), (1, 78), (1, 79), (1, 80), (1, 81), (1, 82),
(1, 6), (1, 7), (1, 8), (1, 9), (1, 10), (1, 11), (1, 20), (1, 21), (1, 22),
(1, 25), (1, 26), (1, 37), (1, 38), (1, 40), (1, 41),
(2, 1), (2, 77), (2, 78), (2, 79), (2, 80), (2, 81), (2, 82),
(2, 6), (2, 7), (2, 9), (2, 10), (2, 20), (2, 21), (2, 25), (2, 26), (2, 37), (2, 38),
-- Finance Manager / Accountant
(3, 1), (3, 6), (3, 8), (3, 9), (3, 10), (3, 11), (3, 20), (3, 21), (3, 22),
(4, 1), (4, 6), (4, 9), (4, 11), (4, 20), (4, 21),
-- Operations Manager
(5, 1), (5, 77), (5, 78), (5, 6), (5, 7), (5, 37), (5, 38),
-- Branch Manager
(6, 1), (6, 77), (6, 6), (6, 37),
-- Support Executive
(7, 1), (7, 6), (7, 37),
-- Viewer
(8, 1), (8, 20), (8, 21), (8, 22)
ON DUPLICATE KEY UPDATE merchant_role_id = VALUES(merchant_role_id);

INSERT INTO state_region_mapping (state_name, state_code, region_id) VALUES
('Maharashtra', 'MH', 3), ('Delhi', 'DL', 3), ('Karnataka', 'KA', 3),
('Tamil Nadu', 'TN', 3), ('Telangana', 'TS', 3), ('Gujarat', 'GJ', 3),
('Rajasthan', 'RJ', 3), ('West Bengal', 'WB', 3), ('Uttar Pradesh', 'UP', 3),
('Madhya Pradesh', 'MP', 3), ('Kerala', 'KL', 3), ('Punjab', 'PB', 3),
('Haryana', 'HR', 3), ('Bihar', 'BR', 3), ('Odisha', 'OR', 3),
('Assam', 'AS', 3), ('Jharkhand', 'JH', 3), ('Chhattisgarh', 'CG', 3),
('Goa', 'GA', 3), ('Himachal Pradesh', 'HP', 3),
('California', 'CA', 1), ('New York', 'NY', 1), ('Texas', 'TX', 1),
('England', 'ENG', 2), ('Bavaria', 'BY', 2), ('Île-de-France', 'IDF', 2)
ON DUPLICATE KEY UPDATE region_id = VALUES(region_id);

INSERT INTO notification_events (uuid, code, name, category, description, is_enabled) VALUES
('ne000030-0000-4000-8000-000000000030', 'merchant_user_invited',  'Merchant User Invited',  'merchant', 'Invitation sent to merchant user', 1),
('ne000031-0000-4000-8000-000000000031', 'outlet_created',         'Outlet Created',         'merchant', 'New outlet created for merchant', 1),
('ne000032-0000-4000-8000-000000000032', 'merchant_role_changed',  'Merchant Role Changed',  'merchant', 'Merchant user role updated', 1),
('ne000033-0000-4000-8000-000000000033', 'merchant_user_activated','Account Activated',      'merchant', 'Merchant user account activated', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO audit_actions (uuid, code, name, category_code, description, risk_level) VALUES
('aa000030-0000-4000-8000-000000000030', 'outlet_create',          'Outlet Created',          'merchants', 'Merchant outlet created', 'low'),
('aa000031-0000-4000-8000-000000000031', 'outlet_update',          'Outlet Updated',          'merchants', 'Merchant outlet updated', 'low'),
('aa000032-0000-4000-8000-000000000032', 'merchant_user_create',   'Merchant User Created',   'users',     'Merchant portal user created', 'low'),
('aa000033-0000-4000-8000-000000000033', 'merchant_user_activate', 'Merchant User Activated', 'users',     'Merchant user account activated', 'medium'),
('aa000034-0000-4000-8000-000000000034', 'merchant_role_change',   'Merchant Role Changed',   'users',     'Merchant user role changed', 'medium'),
('aa000035-0000-4000-8000-000000000035', 'outlet_assigned',        'Outlet Assigned',         'users',     'Outlet access assigned to merchant user', 'low')
ON DUPLICATE KEY UPDATE name = VALUES(name);
