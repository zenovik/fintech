-- =============================================================================
-- 26_dummy_data_roles.sql
-- Roles, permissions, and user assignments
-- Default password for new users: Password123!
-- bcrypt: $2b$12$0bMpMnbObtlR1uYKhzFewe.QcYrhnPcVmGfdpJt96vk8MBn38I43e
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Additional users for role demos
-- ---------------------------------------------------------------------------
INSERT INTO users (id, uuid, email, password_hash, first_name, last_name, phone_number, email_verified_at, status, last_login_at) VALUES
(6,  'a1000006-0000-4000-8000-000000000006', 'finance@merchantpro.com',    '$2b$12$0bMpMnbObtlR1uYKhzFewe.QcYrhnPcVmGfdpJt96vk8MBn38I43e', 'Emily', 'Foster',  '+14155550106', NOW(), 'active', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(7,  'a1000007-0000-4000-8000-000000000007', 'operations@merchantpro.com', '$2b$12$0bMpMnbObtlR1uYKhzFewe.QcYrhnPcVmGfdpJt96vk8MBn38I43e', 'Robert', 'Hayes',  '+14155550107', NOW(), 'active', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(8,  'a1000008-0000-4000-8000-000000000008', 'merchant.mgr@merchantpro.com','$2b$12$0bMpMnbObtlR1uYKhzFewe.QcYrhnPcVmGfdpJt96vk8MBn38I43e', 'Lisa', 'Nguyen',   '+14155550108', NOW(), 'active', DATE_SUB(NOW(), INTERVAL 5 HOUR)),
(9,  'a1000009-0000-4000-8000-000000000009', 'support@merchantpro.com',    '$2b$12$0bMpMnbObtlR1uYKhzFewe.QcYrhnPcVmGfdpJt96vk8MBn38I43e', 'Tom', 'Bradley',   '+14155550109', NOW(), 'active', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(10, 'a1000010-0000-4000-8000-000000000010', 'readonly@merchantpro.com',     '$2b$12$0bMpMnbObtlR1uYKhzFewe.QcYrhnPcVmGfdpJt96vk8MBn38I43e', 'Nina', 'Patel',    '+14155550110', NOW(), 'active', DATE_SUB(NOW(), INTERVAL 1 DAY))
ON DUPLICATE KEY UPDATE first_name = VALUES(first_name);

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
INSERT INTO roles (id, uuid, code, name, description, is_system) VALUES
(1, 'r1000001-0000-4000-8000-000000000001', 'super_admin',        'Super Admin',        'Full system access including permission management', 1),
(2, 'r1000002-0000-4000-8000-000000000002', 'admin',              'Admin',              'Administrative access to all business modules', 1),
(3, 'r1000003-0000-4000-8000-000000000003', 'finance_manager',    'Finance Manager',    'Finance, transactions, and settlements management', 1),
(4, 'r1000004-0000-4000-8000-000000000004', 'operations_manager', 'Operations Manager', 'Operations, merchants, and transactions', 1),
(5, 'r1000005-0000-4000-8000-000000000005', 'merchant_manager',   'Merchant Manager',   'Merchant onboarding and management', 1),
(6, 'r1000006-0000-4000-8000-000000000006', 'support_agent',      'Support Agent',      'Customer support with read access and limited actions', 1),
(7, 'r1000007-0000-4000-8000-000000000007', 'read_only',          'Read Only User',     'View-only access across modules', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
INSERT INTO permissions (id, uuid, code, name, module, description) VALUES
(1,  'p1000001-0000-4000-8000-000000000001', 'dashboard:read',    'View Dashboard',           'dashboard',    'Access executive dashboard'),
(2,  'p1000002-0000-4000-8000-000000000002', 'dashboard:export',  'Export Dashboard',         'dashboard',    'Export dashboard reports'),
(3,  'p1000003-0000-4000-8000-000000000003', 'merchants:read',    'View Merchants',           'merchants',    'List and view merchants'),
(4,  'p1000004-0000-4000-8000-000000000004', 'merchants:write',   'Manage Merchants',         'merchants',    'Create and edit merchants'),
(5,  'p1000005-0000-4000-8000-000000000005', 'merchants:delete',  'Delete Merchants',         'merchants',    'Delete merchants'),
(6,  'p1000006-0000-4000-8000-000000000006', 'transactions:read', 'View Transactions',        'transactions', 'List and view transactions'),
(7,  'p1000007-0000-4000-8000-000000000007', 'transactions:write','Manage Transactions',      'transactions', 'Refund, dispute, status changes'),
(8,  'p1000008-0000-4000-8000-000000000008', 'transactions:export','Export Transactions',     'transactions', 'Export transaction data'),
(9,  'p1000009-0000-4000-8000-000000000009', 'settlements:read',  'View Settlements',         'settlements',  'List and view settlements'),
(10, 'p1000010-0000-4000-8000-000000000010', 'settlements:write', 'Manage Settlements',       'settlements',  'Create settlements, reversals, batches'),
(11, 'p1000011-0000-4000-8000-000000000011', 'settlements:export','Export Settlements',       'settlements',  'Export settlement data'),
(12, 'p1000012-0000-4000-8000-000000000012', 'users:read',        'View Users',               'users',        'List and view users'),
(13, 'p1000013-0000-4000-8000-000000000013', 'users:write',       'Manage Users',             'users',        'Create and edit users'),
(14, 'p1000014-0000-4000-8000-000000000014', 'users:delete',      'Delete Users',             'users',        'Deactivate or delete users'),
(15, 'p1000015-0000-4000-8000-000000000015', 'roles:read',        'View Roles',               'roles',        'List and view roles'),
(16, 'p1000016-0000-4000-8000-000000000016', 'roles:write',       'Manage Roles',             'roles',        'Create and edit roles'),
(17, 'p1000017-0000-4000-8000-000000000017', 'roles:delete',      'Delete Roles',             'roles',        'Delete custom roles'),
(18, 'p1000018-0000-4000-8000-000000000018', 'permissions:read',  'View Permissions',         'permissions',  'View permission matrix'),
(19, 'p1000019-0000-4000-8000-000000000019', 'permissions:manage','Manage Permissions',     'permissions',  'Assign permissions to roles')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Super Admin — all permissions
INSERT INTO role_permissions (role_id, permission_id) SELECT 1, id FROM permissions ON DUPLICATE KEY UPDATE granted_at = granted_at;

-- Admin — all except permissions:manage
INSERT INTO role_permissions (role_id, permission_id) SELECT 2, id FROM permissions WHERE code != 'permissions:manage' ON DUPLICATE KEY UPDATE granted_at = granted_at;

-- Finance Manager
INSERT INTO role_permissions (role_id, permission_id) VALUES
(3,1),(3,2),(3,6),(3,7),(3,8),(3,9),(3,10),(3,11)
ON DUPLICATE KEY UPDATE granted_at = granted_at;

-- Operations Manager
INSERT INTO role_permissions (role_id, permission_id) VALUES
(4,1),(4,3),(4,4),(4,6),(4,7),(4,8)
ON DUPLICATE KEY UPDATE granted_at = granted_at;

-- Merchant Manager
INSERT INTO role_permissions (role_id, permission_id) VALUES
(5,3),(5,4)
ON DUPLICATE KEY UPDATE granted_at = granted_at;

-- Support Agent
INSERT INTO role_permissions (role_id, permission_id) VALUES
(6,1),(6,3),(6,6),(6,9),(6,12)
ON DUPLICATE KEY UPDATE granted_at = granted_at;

-- Read Only — all :read permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 7, id FROM permissions WHERE code LIKE '%:read'
ON DUPLICATE KEY UPDATE granted_at = granted_at;

-- ---------------------------------------------------------------------------
-- User role assignments
-- ---------------------------------------------------------------------------
INSERT INTO user_roles (user_id, role_id, assigned_by) VALUES
(1, 1, 1),   -- admin@merchantpro.com → Super Admin
(6, 3, 1),   -- finance@ → Finance Manager
(7, 4, 1),   -- operations@ → Operations Manager
(8, 5, 1),   -- merchant.mgr@ → Merchant Manager
(9, 6, 1),   -- support@ → Support Agent
(10, 7, 1)   -- readonly@ → Read Only
ON DUPLICATE KEY UPDATE assigned_at = assigned_at;

-- ---------------------------------------------------------------------------
-- Sample activity logs & login history
-- ---------------------------------------------------------------------------
INSERT INTO user_activity_logs (uuid, user_id, actor_user_id, action, resource_type, resource_id, ip_address, metadata, created_at) VALUES
('ual10001-0000-4000-8000-000000000001', 6, 1, 'user.created', 'user', '6', '188.166.34.112', JSON_OBJECT('email', 'finance@merchantpro.com'), DATE_SUB(NOW(), INTERVAL 5 DAY)),
('ual10002-0000-4000-8000-000000000002', 1, 1, 'role.assigned', 'user', '1', '188.166.34.112', JSON_OBJECT('role', 'super_admin'), DATE_SUB(NOW(), INTERVAL 30 DAY)),
('ual10003-0000-4000-8000-000000000003', 8, 8, 'merchant.updated', 'merchant', '1', '92.184.101.44', JSON_OBJECT('field', 'status'), DATE_SUB(NOW(), INTERVAL 2 DAY))
ON DUPLICATE KEY UPDATE action = VALUES(action);

INSERT INTO login_history (user_id, email_attempted, ip_address, success, failure_reason, created_at) VALUES
(1, 'admin@merchantpro.com', '188.166.34.112', 1, NULL, DATE_SUB(NOW(), INTERVAL 2 MINUTE)),
(6, 'finance@merchantpro.com', '203.0.113.10', 1, NULL, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(10, 'readonly@merchantpro.com', '81.102.12.98', 1, NULL, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(NULL, 'unknown@merchantpro.com', '198.51.100.5', 0, 'invalid_credentials', DATE_SUB(NOW(), INTERVAL 3 HOUR)),
(3, 'locked.user@merchantpro.com', '198.51.100.5', 0, 'account_locked', DATE_SUB(NOW(), INTERVAL 1 HOUR));
