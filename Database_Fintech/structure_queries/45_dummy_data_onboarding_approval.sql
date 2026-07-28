-- =============================================================================
-- 45_dummy_data_onboarding_approval.sql
-- Workflow stages, permissions, demo approval data
-- =============================================================================

INSERT INTO onboarding_workflow_stage_definitions (id, code, name, sequence_order, sla_hours, required_role, is_skippable, is_terminal, maps_to_status) VALUES
(1, 'submitted',         'Submitted',          1, 24,  NULL,              0, 0, 'submitted'),
(2, 'compliance_review', 'Compliance Review',  2, 48,  'compliance_officer', 0, 0, 'compliance_review'),
(3, 'risk_review',       'Risk Review',        3, 48,  'risk_analyst',    0, 0, 'risk_review'),
(4, 'business_review',   'Business Review',    4, 72,  'business_approver', 0, 0, 'business_review'),
(5, 'approved',          'Approved',           5, 24,  NULL,              0, 0, 'approved'),
(6, 'rejected',          'Rejected',           6,  0,  NULL,              0, 1, 'rejected'),
(7, 'sent_back',         'Sent Back',          7,  0,  NULL,              0, 0, 'sent_back'),
(8, 'go_live',           'Go Live',            8, 24,  'operations_manager', 0, 0, 'go_live'),
(9, 'completed',         'Completed',          9,  0,  NULL,              0, 1, 'completed')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO permissions (id, uuid, code, name, module, description) VALUES
(83, 'p1000083-0000-4000-8000-000000000083', 'onboarding_workflow:read',      'View Approval Workflow',   'onboarding_approval', 'View workflow status and history'),
(84, 'p1000084-0000-4000-8000-000000000084', 'onboarding_workflow:write',     'Manage Workflow',          'onboarding_approval', 'Assign and update workflow'),
(85, 'p1000085-0000-4000-8000-000000000085', 'onboarding_workflow:approve',   'Approve Application',      'onboarding_approval', 'Approve workflow stage'),
(86, 'p1000086-0000-4000-8000-000000000086', 'onboarding_workflow:reject',    'Reject Application',       'onboarding_approval', 'Reject workflow stage'),
(87, 'p1000087-0000-4000-8000-000000000087', 'onboarding_workflow:send_back', 'Send Back Application',    'onboarding_approval', 'Send application back for correction'),
(88, 'p1000088-0000-4000-8000-000000000088', 'onboarding_workflow:reassign',  'Reassign Reviewer',        'onboarding_approval', 'Reassign workflow reviewer'),
(89, 'p1000089-0000-4000-8000-000000000089', 'onboarding_workflow:skip',      'Skip Workflow Stage',      'onboarding_approval', 'Skip stage with elevated permission'),
(90, 'p1000090-0000-4000-8000-000000000090', 'compliance_queue:read',         'View Compliance Queue',    'onboarding_approval', 'View compliance work queue'),
(91, 'p1000091-0000-4000-8000-000000000091', 'compliance_queue:manage',       'Manage Compliance Queue',  'onboarding_approval', 'Bulk assign and approve compliance'),
(92, 'p1000092-0000-4000-8000-000000000092', 'risk_review:read',              'View Risk Reviews',        'onboarding_approval', 'View risk review assessments'),
(93, 'p1000093-0000-4000-8000-000000000093', 'risk_review:write',             'Manage Risk Reviews',      'onboarding_approval', 'Create and submit risk decisions'),
(94, 'p1000094-0000-4000-8000-000000000094', 'kyc_review:read',               'View KYC Reviews',         'onboarding_approval', 'View KYC document reviews'),
(95, 'p1000095-0000-4000-8000-000000000095', 'kyc_review:write',              'Manage KYC Reviews',       'onboarding_approval', 'Approve/reject KYC documents'),
(96, 'p1000096-0000-4000-8000-000000000096', 'go_live:execute',               'Execute Go Live',          'onboarding_approval', 'Promote merchant to go live')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO role_permissions (role_id, permission_id) VALUES
(1, 83), (1, 84), (1, 85), (1, 86), (1, 87), (1, 88), (1, 89), (1, 90), (1, 91), (1, 92), (1, 93), (1, 94), (1, 95), (1, 96),
(2, 83), (2, 84), (2, 85), (2, 86), (2, 87), (2, 88), (2, 90), (2, 91), (2, 92), (2, 93), (2, 94), (2, 95), (2, 96),
(5, 83), (5, 84), (5, 85), (5, 90), (5, 94), (5, 95), (5, 96)
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

INSERT INTO notification_events (uuid, code, name, category, description, is_enabled) VALUES
('ne000040-0000-4000-8000-000000000040', 'onboarding_assigned',       'Application Assigned',       'merchant', 'Onboarding assigned to reviewer', 1),
('ne000041-0000-4000-8000-000000000041', 'onboarding_sla_warning',    'SLA Warning',                'merchant', 'Onboarding SLA approaching breach', 1),
('ne000042-0000-4000-8000-000000000042', 'onboarding_sent_back',      'Application Sent Back',      'merchant', 'Onboarding sent back for correction', 1),
('ne000043-0000-4000-8000-000000000043', 'onboarding_go_live_done',   'Go Live Completed',          'merchant', 'Merchant go live completed', 1),
('ne000044-0000-4000-8000-000000000044', 'merchant_activated',        'Merchant Activated',         'merchant', 'Merchant account activated', 1),
('ne000045-0000-4000-8000-000000000045', 'kyc_document_verified',     'KYC Document Verified',      'merchant', 'KYC document verification update', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO audit_actions (uuid, code, name, category_code, description, risk_level) VALUES
('aa000040-0000-4000-8000-000000000040', 'workflow_approve',   'Workflow Approved',   'merchants', 'Approval workflow stage approved', 'medium'),
('aa000041-0000-4000-8000-000000000041', 'workflow_reject',    'Workflow Rejected',   'merchants', 'Approval workflow stage rejected', 'high'),
('aa000042-0000-4000-8000-000000000042', 'workflow_send_back', 'Workflow Sent Back',  'merchants', 'Application sent back in workflow', 'medium'),
('aa000043-0000-4000-8000-000000000043', 'workflow_reassign',  'Workflow Reassigned', 'merchants', 'Workflow reviewer reassigned', 'low'),
('aa000044-0000-4000-8000-000000000044', 'risk_decision',      'Risk Decision',       'merchants', 'Risk review decision recorded', 'high'),
('aa000045-0000-4000-8000-000000000045', 'kyc_verified',       'KYC Verified',        'merchants', 'KYC document verification action', 'medium'),
('aa000046-0000-4000-8000-000000000046', 'merchant_sync',      'Merchant Status Sync','merchants', 'Merchant status synchronized', 'medium')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Workflow instances for demo applications
INSERT INTO onboarding_workflow_instances
  (id, uuid, application_id, current_stage_id, previous_stage_id, assigned_user_id, assigned_role_code, priority, workflow_status, sla_due_at, sla_breached, started_at) VALUES
(1,  'owi00001-0000-4000-8000-000000000001', 3,  2, 1, 1, 'compliance_officer', 'high',   'in_progress', DATE_ADD(NOW(), INTERVAL 12 HOUR), 0, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2,  'owi00002-0000-4000-8000-000000000002', 4,  2, 1, 1, 'compliance_officer', 'normal', 'pending',     DATE_ADD(NOW(), INTERVAL 36 HOUR), 0, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3,  'owi00003-0000-4000-8000-000000000003', 5,  3, 2, 1, 'risk_analyst',       'urgent', 'overdue',     DATE_SUB(NOW(), INTERVAL 6 HOUR),  1, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(4,  'owi00004-0000-4000-8000-000000000004', 7,  4, 3, 1, 'business_approver',  'normal', 'in_progress', DATE_ADD(NOW(), INTERVAL 48 HOUR), 0, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(5,  'owi00005-0000-4000-8000-000000000005', 9,  5, 4, NULL, NULL,              'normal', 'completed',   NULL, 0, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(6,  'owi00006-0000-4000-8000-000000000006', 11, 6, 2, NULL, NULL,              'low',    'rejected',    NULL, 0, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(7,  'owi00007-0000-4000-8000-000000000007', 13, 9, 8, NULL, NULL,              'normal', 'completed',   NULL, 0, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(8,  'owi00008-0000-4000-8000-000000000008', 19, 2, 1, 2, 'compliance_officer', 'high',   'pending',     DATE_ADD(NOW(), INTERVAL 24 HOUR), 0, DATE_SUB(NOW(), INTERVAL 1 HOUR))
ON DUPLICATE KEY UPDATE workflow_status = VALUES(workflow_status);

UPDATE merchant_onboarding_applications SET onboarding_status = 'compliance_review' WHERE id IN (3, 4, 19);
UPDATE merchant_onboarding_applications SET onboarding_status = 'risk_review' WHERE id = 5;
UPDATE merchant_onboarding_applications SET onboarding_status = 'business_review' WHERE id = 7;
UPDATE merchant_onboarding_applications SET onboarding_status = 'completed' WHERE id = 13;

INSERT INTO onboarding_risk_reviews
  (id, uuid, application_id, business_category, country, state, kyc_score, document_verification_score, watchlist_match, blacklist_match, manual_risk_score, final_risk_score, risk_level, decision, reviewer_id, reviewed_at) VALUES
(1, 'orr00001-0000-4000-8000-000000000001', 5,  'Fintech', 'India', 'Maharashtra', 82.5, 90.0, 0, 0, 75.0, 82.0, 'medium',  'pending',   NULL, NULL),
(2, 'orr00002-0000-4000-8000-000000000002', 7,  'Travel',  'India', 'Karnataka',  91.0, 95.0, 0, 0, 88.0, 91.5, 'low',     'approved',  1, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(3, 'orr00003-0000-4000-8000-000000000003', 11, 'Retail',  'India', 'Delhi',      45.0, 50.0, 1, 0, 40.0, 48.0, 'critical','rejected',  1, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(4, 'orr00004-0000-4000-8000-000000000004', 3,  'Logistics','India','Tamil Nadu', 70.0, 78.0, 0, 0, 65.0, 71.0, 'medium',  'pending',   NULL, NULL)
ON DUPLICATE KEY UPDATE risk_level = VALUES(risk_level);

UPDATE merchant_onboarding_kyc_documents SET verification_status = 'approved', verified_by = 1, verified_at = DATE_SUB(NOW(), INTERVAL 10 DAY) WHERE application_id IN (13, 14, 15);
UPDATE merchant_onboarding_kyc_documents SET verification_status = 'pending' WHERE application_id IN (3, 4, 5, 7);
UPDATE merchant_onboarding_kyc_documents SET verification_status = 'rejected', verified_by = 1, verified_at = DATE_SUB(NOW(), INTERVAL 5 DAY), verifier_remarks = 'Document unclear' WHERE application_id = 11;

INSERT INTO merchant_tax_profiles
  (id, uuid, application_id, merchant_id, legal_name, trade_name, business_type, gst_number, pan_number, cin_number, is_current, created_by) VALUES
(1, 'mtp00001-0000-4000-8000-000000000001', 9,  NULL, 'ZenPay Retail India Pvt Ltd', 'ZenPay Retail', 'fintech', '27AAACZ6789G1Z8', 'AAACZ6789G', NULL, 1, 1),
(2, 'mtp00002-0000-4000-8000-000000000002', 13, 1,    'Prime Electronics Trading Pvt Ltd', 'Prime Electronics', 'retail', '27AAACP2345K1Z2', 'AAACP2345K', NULL, 1, 1),
(3, 'mtp00003-0000-4000-8000-000000000003', 13, 1,    'Prime Electronics Trading Pvt Ltd', 'Prime Electronics', 'retail', '27AAACP2345K1Z2', 'AAACP2345K', NULL, 0, 1)
ON DUPLICATE KEY UPDATE legal_name = VALUES(legal_name);

INSERT INTO onboarding_workflow_stage_history
  (uuid, application_id, workflow_instance_id, stage_id, previous_stage_id, next_stage_id, decision, assigned_user_id, decided_by, remarks, decided_at) VALUES
('owsh0001-0000-4000-8000-000000000001', 3,  1, 1, NULL, 2, 'submitted', NULL, 2, 'Application submitted', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('owsh0002-0000-4000-8000-000000000002', 3,  1, 2, 1,    2, 'assigned',  1,    1, 'Assigned to compliance', DATE_SUB(NOW(), INTERVAL 20 HOUR)),
('owsh0003-0000-4000-8000-000000000003', 5,  3, 2, 1,    3, 'approve',   1,    1, 'Compliance cleared', DATE_SUB(NOW(), INTERVAL 2 DAY)),
('owsh0004-0000-4000-8000-000000000004', 11, 6, 2, 1,    6, 'reject',    1,    1, 'Failed compliance - incomplete docs', DATE_SUB(NOW(), INTERVAL 5 DAY)),
('owsh0005-0000-4000-8000-000000000005', 13, 7, 8, 5,    9, 'go_live',   NULL, 1, 'Merchant went live', DATE_SUB(NOW(), INTERVAL 7 DAY))
ON DUPLICATE KEY UPDATE remarks = VALUES(remarks);
