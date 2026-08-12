# Business Rules — Merchant Pro

Numbered business rules (BR-) governing platform behavior. Cross-reference: [Product_Functional_Specification.md §8](./Product_Functional_Specification.md#8-business-rules).

## Authentication & Session

| ID | Rule | Enforcement |
|----|------|---------------|
| BR-AUTH-001 | Password minimum 8 characters with uppercase, number, or special character | Zod schema on login/reset |
| BR-AUTH-002 | Account locked after 5 failed login attempts for 30 minutes (configurable) | Auth service |
| BR-AUTH-003 | MFA required when enabled and device not trusted | Login returns 202 challenge |
| BR-AUTH-004 | OTP is 6 digits; resend cooldown 59 seconds | OTP service |
| BR-AUTH-005 | Access token expires in 15 minutes (default) | JWT config |
| BR-AUTH-006 | Refresh token expires in 7 days (30 days if remember device) | Cookie expiry |
| BR-AUTH-007 | Refresh token reuse revokes all user sessions | Token service |
| BR-AUTH-008 | Password reset tokens expire in 60 minutes (configurable) | DB `expires_at` |
| BR-AUTH-009 | Forgot-password response is generic (anti-enumeration) | Controller always success message |
| BR-AUTH-010 | CSRF required on cookie-authenticated mutating requests | CSRF middleware |
| BR-AUTH-011 | Bearer-authenticated API clients exempt from CSRF | CSRF middleware |
| BR-AUTH-012 | Org MFA enforcement blocks user disabling MFA | MFA preferences check |
| BR-AUTH-013 | Session idle timeout 15 minutes (configurable) | Frontend session service |
| BR-AUTH-014 | Max 5 concurrent sessions per user (configurable) | Session repository |

## Authorization & Tenancy

| ID | Rule | Enforcement |
|----|------|---------------|
| BR-RBAC-001 | Super admin bypasses all permission checks | Authorize middleware |
| BR-RBAC-002 | Permission format: `{resource}:{action}` | RBAC constants |
| BR-RBAC-003 | Org `viewer` role limited to read/export | Org role cap filter |
| BR-RBAC-004 | Org `member` role blocks write/approve/delete/manage | Org role cap filter |
| BR-RBAC-005 | Merchant role caps intersect global permissions | Merchant middleware |
| BR-RBAC-006 | Branch managers limited to assigned outlets | Outlet scope check |
| BR-ORG-001 | Organization context required on org-scoped routes | `requireOrganization()` |
| BR-ORG-002 | User must be member of requested organization | Membership validation |
| BR-ORG-003 | All queries filter by `organization_id` when context present | Repository filters |
| BR-MER-001 | Merchant must belong to active organization | `assertMerchantInOrg()` |
| BR-MER-002 | Customer must belong to active organization | `assertCustomerInOrg()` |
| BR-MER-003 | Cross-tenant merchant access returns 403/404 | Integration verified |

## Payments

| ID | Rule | Enforcement |
|----|------|---------------|
| BR-PAY-001 | Payment intent created in `pending` state | Payment engine |
| BR-PAY-002 | Only valid state transitions allowed (see lifecycle) | `canTransition()` |
| BR-PAY-003 | Terminal states: failed, expired, refunded, chargeback, cancelled | State machine |
| BR-PAY-004 | Capture requires prior `authorized` state | Payment service |
| BR-PAY-005 | Refund amount cannot exceed captured amount | Refund math guard |
| BR-PAY-006 | Partial refund transitions to `partially_refunded` | State machine |
| BR-PAY-007 | Payment events emit webhooks: created, authorized, captured, failed, refunded, settled | Webhook engine |
| BR-PAY-008 | Idempotency key honored on payment create | Payment repository |
| BR-PAY-009 | Expired checkout/session rejects payment | Checkout service |

## Refunds & Chargebacks

| ID | Rule | Enforcement |
|----|------|---------------|
| BR-REF-001 | Refunds require `payments:refund` or module approve workflow | RBAC + refund service |
| BR-REF-002 | Pending refunds require approval before processing | Refund status workflow |
| BR-CB-001 | Chargeback links to captured/settled payment | Chargeback service |
| BR-CB-002 | Resolve maps to merchant_won or merchant_lost | Status mapping |

## Subscriptions & Invoices

| ID | Rule | Enforcement |
|----|------|---------------|
| BR-SUB-001 | Billing period formatted consistently in API responses | Subscription service |
| BR-INV-001 | Invoice email dispatched via background job | `invoice_email` job |
| BR-INV-002 | Invoice PDF generated on demand | Invoice service |

## Webhooks & Workers

| ID | Rule | Enforcement |
|----|------|---------------|
| BR-WH-001 | Outbound webhooks signed HMAC-SHA256 when secret configured | Delivery engine |
| BR-WH-002 | Signature format: `t={timestamp},v1={hex}` | Header `X-Webhook-Signature` |
| BR-WH-003 | Max delivery attempts default 3 | Queue config |
| BR-WH-004 | Exponential backoff: base × 2^(attempt-1), max 3600s | Delivery engine |
| BR-WH-005 | Exhausted retries → `dead_letter` (platform) or `failed` (payment) | Queue processor |
| BR-WH-006 | Manual retry creates replay history record | Webhooks service |
| BR-WH-007 | Queue claim uses `SELECT ... FOR UPDATE` | Transaction isolation |
| BR-JOB-001 | Unknown job types marked failed and audited | Job handlers |
| BR-JOB-002 | Worker concurrency default 5 | Env config |
| BR-JOB-003 | Password reset email auto-completed in test mode | Test helper |

## Audit & Notifications

| ID | Rule | Enforcement |
|----|------|---------------|
| BR-AUD-001 | Audit writes persist `organization_id` from context | Audit repository |
| BR-AUD-002 | Audit reads filtered by organization when context present | Query filters |
| BR-AUD-003 | Sensitive fields masked in logs | PII mask helper |
| BR-NOT-001 | Notification delivery via email background job | Job handler |
| BR-NOT-002 | User preferences control notification channels | Preference mapping |

## Rate Limiting & Feature Flags

| ID | Rule | Enforcement |
|----|------|---------------|
| BR-RL-001 | Global rate limit 2000 req/15min (production) | Global middleware |
| BR-RL-002 | API rate limit 300 req/min | API middleware |
| BR-RL-003 | Login limit 20/15min; forgot-password 10/15min | Auth routes |
| BR-FF-001 | Disabled feature flag returns 403 on blocked routes | Feature flag guard |
| BR-FF-002 | Feature flag cache TTL 60 seconds | Middleware cache |

## Public Payment Pages

| ID | Rule | Enforcement |
|----|------|---------------|
| BR-PUB-001 | Public checkout accessible without authentication | Public routes |
| BR-PUB-002 | Payment link/QR pay validates token and amount | Public services |
| BR-PUB-003 | Expired links/sessions reject payment | Expiry check |

**Total business rules documented:** 52
