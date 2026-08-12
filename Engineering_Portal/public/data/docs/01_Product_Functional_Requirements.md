# Functional Requirements — Merchant Pro

Requirements use prefix **FR-**. Priority: **P1** (must), **P2** (should), **P3** (could).

## Authentication (FR-AUTH)

| ID | Title | Description | Priority | Acceptance Criteria | Expected Result |
|----|-------|-------------|----------|-------------------|-----------------|
| FR-AUTH-001 | User Login | User authenticates with email and password | P1 | Valid credentials return access + refresh tokens | HTTP 200 with user profile |
| FR-AUTH-002 | MFA Challenge | MFA-enabled users receive OTP/TOTP challenge | P1 | Login returns 202 with challengeId | User redirected to verify-otp |
| FR-AUTH-003 | MFA Verification | User submits 6-digit OTP | P1 | Valid OTP completes login | Session established |
| FR-AUTH-004 | Token Refresh | Client refreshes expired access token | P1 | Valid refresh cookie returns new access token | HTTP 200; old refresh invalidated |
| FR-AUTH-005 | Logout | User terminates session | P1 | Logout revokes session and clears cookies | Subsequent requests return 401 |
| FR-AUTH-006 | Forgot Password | User requests password reset email | P1 | Valid email enqueues reset job | Generic success message |
| FR-AUTH-007 | Reset Password | User sets new password with token | P1 | Valid token + policy-compliant password | Password updated; sessions revoked |
| FR-AUTH-008 | Organization Selection | Multi-org user selects active org | P1 | POST select-organization embeds org in JWT | Org context available on API calls |
| FR-AUTH-009 | Session Management | User views and revokes sessions | P2 | List sessions; revoke others/single | Sessions updated in DB |
| FR-AUTH-010 | CSRF Protection | Browser clients obtain CSRF token | P1 | GET csrf-token; mutating requests include header | Invalid CSRF returns 403 |

## Authorization (FR-RBAC)

| ID | Title | Description | Priority | Acceptance Criteria | Expected Result |
|----|-------|-------------|----------|-------------------|-----------------|
| FR-RBAC-001 | Permission Enforcement | API routes require specific permissions | P1 | Unauthorized role receives 403 | Action blocked |
| FR-RBAC-002 | Org Role Cap | Org membership caps effective permissions | P1 | Viewer cannot POST to write endpoints | HTTP 403 |
| FR-RBAC-003 | Merchant Context | Merchant header activates portal cap | P1 | Branch manager limited to assigned outlets | Scoped data only |
| FR-RBAC-004 | Super Admin Bypass | Super admin accesses all endpoints | P1 | Super admin passes all authorize checks | Full access |

## Merchants & Onboarding (FR-MER)

| ID | Title | Description | Priority | Acceptance Criteria | Expected Result |
|----|-------|-------------|----------|-------------------|-----------------|
| FR-MER-001 | Create Merchant | Admin creates merchant in org | P1 | Valid payload creates merchant record | HTTP 201 |
| FR-MER-002 | Org Isolation | Merchant visible only within org | P1 | Cross-org GET returns 404/403 | Tenant isolation |
| FR-MER-003 | Merchant Search | User searches merchants with pagination | P1 | Query params page/pageSize work | Paginated list |
| FR-MER-004 | Onboarding Workflow | Submit merchant for approval | P1 | Onboarding record created with status | Workflow started |
| FR-MER-005 | KYC Review | Compliance reviews KYC documents | P1 | Approve/reject updates status | Merchant status updated |
| FR-MER-006 | Outlet Management | Create and manage merchant outlets | P2 | CRUD on outlets scoped to merchant | Outlet records |

## Payments (FR-PAY)

| ID | Title | Description | Priority | Acceptance Criteria | Expected Result |
|----|-------|-------------|----------|-------------------|-----------------|
| FR-PAY-001 | Create Payment Intent | Create payment with amount/currency | P1 | Valid create returns intent id | Status `pending` |
| FR-PAY-002 | Authorize Payment | Move intent to authorized | P1 | Valid transition from pending/processing | Status `authorized` |
| FR-PAY-003 | Capture Payment | Capture authorized funds | P1 | Valid transition from authorized | Status `captured` |
| FR-PAY-004 | Cancel Payment | Cancel non-terminal intent | P1 | Valid cancel transition | Status `cancelled` |
| FR-PAY-005 | Invalid Transition Rejection | Block illegal state changes | P1 | Capture on pending returns error | HTTP 400/422 |
| FR-PAY-006 | Payment Timeline | Record lifecycle events | P2 | Each transition creates timeline entry | Audit trail visible |
| FR-PAY-007 | Idempotent Create | Duplicate idempotency key returns same intent | P1 | Same key + payload → same id | No duplicate charge |

## Checkout & Public Pay (FR-CHK)

| ID | Title | Description | Priority | Acceptance Criteria | Expected Result |
|----|-------|-------------|----------|-------------------|-----------------|
| FR-CHK-001 | Create Checkout Session | Merchant creates hosted checkout | P1 | Session with expiry returned | Public URL available |
| FR-CHK-002 | Public Checkout Pay | Customer pays on public page | P1 | Valid session + amount completes payment | HTTP 201 |
| FR-CHK-003 | Expired Session Rejection | Expired session rejects payment | P1 | Pay on expired session fails | HTTP 4xx |
| FR-PL-001 | Payment Link Create | Create shareable payment link | P1 | Link with public token returned | Customer can pay |
| FR-PL-002 | Payment Link Expire | Merchant expires active link | P2 | Expire endpoint sets inactive | Pay rejected |
| FR-QR-001 | QR Payment Create | Generate QR payment | P1 | QR with public token | Customer scan-to-pay |
| FR-QR-002 | QR Disable | Disable active QR | P2 | Disable endpoint | Public pay rejected |

## Refunds & Chargebacks (FR-REF)

| ID | Title | Description | Priority | Acceptance Criteria | Expected Result |
|----|-------|-------------|----------|-------------------|-----------------|
| FR-REF-001 | Full Refund | Refund captured payment fully | P1 | Amount = captured | Status `refunded` |
| FR-REF-002 | Partial Refund | Refund portion of capture | P1 | Amount < captured | `partially_refunded` |
| FR-REF-003 | Refund Approval | Approve pending refund | P1 | Approver with permission | Refund processed |
| FR-CB-001 | Create Chargeback | Record chargeback on payment | P1 | Links to payment | Chargeback record |
| FR-CB-002 | Resolve Chargeback | Mark merchant won/lost | P1 | Resolve with outcome | Status updated |

## Subscriptions & Invoices (FR-SUB)

| ID | Title | Description | Priority | Acceptance Criteria | Expected Result |
|----|-------|-------------|----------|-------------------|-----------------|
| FR-SUB-001 | Create Subscription Plan | Define recurring plan | P2 | Plan with billing period | Plan record |
| FR-SUB-002 | Subscriber Lifecycle | Activate/cancel subscription | P2 | Status transitions | Billing state updated |
| FR-INV-001 | Create Invoice | Issue invoice to customer | P2 | Invoice with line items | PDF/link available |
| FR-INV-002 | Invoice Email | Send invoice via email | P2 | Background job dispatched | Email queued |

## Developer & Webhooks (FR-DEV)

| ID | Title | Description | Priority | Acceptance Criteria | Expected Result |
|----|-------|-------------|----------|-------------------|-----------------|
| FR-DEV-001 | Developer Profile | Create developer profile | P2 | Profile in org context | HTTP 201 |
| FR-DEV-002 | OAuth App | Register OAuth application | P2 | Client ID/secret returned once | App record |
| FR-DEV-003 | API Key List | View organization API keys | P2 | Keys listed (masked) | HTTP 200 |
| FR-WH-001 | Webhook Endpoint CRUD | Manage webhook URLs | P1 | Create/update/delete endpoints | Webhook configured |
| FR-WH-002 | Event Subscription | Subscribe endpoint to events | P1 | Subscription per event type | Events routed |
| FR-WH-003 | Delivery Retry | Manual retry failed delivery | P2 | Retry creates replay history | Re-delivery attempted |
| FR-WH-004 | Signed Delivery | HMAC signature on outbound POST | P1 | Secret configured → signature header | Merchant can verify |

## Sandbox (FR-SBX)

| ID | Title | Description | Priority | Acceptance Criteria | Expected Result |
|----|-------|-------------|----------|-------------------|-----------------|
| FR-SBX-001 | Sandbox Dashboard | View sandbox environment stats | P2 | Dashboard metrics | HTTP 200 |
| FR-SBX-002 | Test Payment Simulation | Simulate payment events | P2 | Simulation type mapping | Test event recorded |

## Reports & Analytics (FR-RPT)

| ID | Title | Description | Priority | Acceptance Criteria | Expected Result |
|----|-------|-------------|----------|-------------------|-----------------|
| FR-RPT-001 | Report Templates | List/create report templates | P2 | CRUD on templates | Templates available |
| FR-RPT-002 | Scheduled Reports | Schedule report delivery | P2 | Cron expression saved | Job scheduled |
| FR-RPT-003 | Analytics Endpoints | Domain analytics (16 endpoints) | P2 | Permission-gated analytics | JSON metrics |
| FR-RPT-004 | Executive Dashboard | KPI dashboard | P1 | dashboard:read permission | KPIs displayed |

## Audit & Operations (FR-OPS)

| ID | Title | Description | Priority | Acceptance Criteria | Expected Result |
|----|-------|-------------|----------|-------------------|-----------------|
| FR-AUD-001 | Audit Log Search | Search audit by filters | P1 | Org-scoped results | Paginated audit list |
| FR-AUD-002 | Audit Export | Export audit logs | P2 | export permission | File generated |
| FR-OPS-001 | Operations Dashboard | View alerts and incidents | P2 | operations:read | Dashboard data |
| FR-OPS-002 | Retry Queue | Retry failed operations items | P2 | operations:manage | Item requeued |
| FR-ACT-001 | Activity Center | Recent activity feed | P2 | activity_center:read | Activity list |
| FR-SRC-001 | Global Search | Cross-module search | P2 | global_search:read | Search results |

## Notifications & Support (FR-SUP)

| ID | Title | Description | Priority | Acceptance Criteria | Expected Result |
|----|-------|-------------|----------|-------------------|-----------------|
| FR-NOT-001 | Notification Inbox | User views notifications | P2 | notifications:read | Inbox list |
| FR-NOT-002 | Broadcast | Admin broadcasts notification | P2 | broadcast permission | Delivered to users |
| FR-SUP-001 | Support Ticket CRUD | Create/manage tickets | P2 | support:write | Ticket lifecycle |
| FR-SUP-002 | Ticket Escalation | Escalate ticket priority | P2 | Escalate action | Priority updated |

## Settings & System (FR-SYS)

| ID | Title | Description | Priority | Acceptance Criteria | Expected Result |
|----|-------|-------------|----------|-------------------|-----------------|
| FR-SET-001 | Organization Settings | Update org profile/settings | P1 | organizations:write | Settings saved |
| FR-SET-002 | Feature Flags | Toggle feature availability | P1 | settings:write | Routes gated |
| FR-SET-003 | Security Settings | Password policy, session config | P1 | settings:write | Policy enforced |
| FR-SET-004 | SMTP Configuration | Configure email delivery | P2 | Encrypted secret storage | Email jobs work |
| FR-SYS-001 | System Health | View health/readiness | P1 | system:view or public health | Status JSON |
| FR-SYS-002 | AI Chat | User queries AI assistant | P2 | ai:chat; rate limit 20/min | Response returned |

## Users & Roles (FR-USR)

| ID | Title | Description | Priority | Acceptance Criteria | Expected Result |
|----|-------|-------------|----------|-------------------|-----------------|
| FR-USR-001 | User CRUD | Manage platform users | P1 | users:write/delete | User records |
| FR-USR-002 | Role CRUD | Manage roles and permissions | P1 | roles:write | Role updated |
| FR-USR-003 | Permission List | View all permissions | P1 | permissions:read | 144 permissions listed |

## Settlements & Payouts (FR-FIN)

| ID | Title | Description | Priority | Acceptance Criteria | Expected Result |
|----|-------|-------------|----------|-------------------|-----------------|
| FR-SETT-001 | Settlement Batches | View/create settlement batches | P2 | settlements:read/write | Batch records |
| FR-PAYT-001 | Payout Request | Create payout to bank account | P2 | payouts:write | Payout pending |
| FR-PAYT-002 | Payout Approval | Approve/reject payout | P2 | payouts:approve | Status updated |
| FR-REC-001 | Reconciliation | Match settlement records | P2 | reconciliation:write | Reconciliation status |

**Total functional requirements:** 78

See [Product_Functional_Specification.md §9](./Product_Functional_Specification.md#9-functional-requirements) for consolidated view.
