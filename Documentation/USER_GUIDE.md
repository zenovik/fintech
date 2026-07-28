# User Guide — Merchant Pro v1.0.0 RC1

End-user guide for daily operations on the Merchant Pro platform.

**Login URL:** `http://localhost:4200/auth/login` (development)  
**Demo account:** `admin@merchantpro.com` / `Password123!`

---

## Getting Started

1. Open the application URL in your browser.
2. Enter your email and password on the login page.
3. If MFA is enabled, enter the 6-digit OTP sent to your registered device.
4. If you belong to multiple organizations, select your organization.
5. You land on the **Executive Dashboard**.

Navigation is via the left sidebar. Available menu items depend on your role and permissions.

---

## Dashboard

**Path:** `/dashboard`

The Executive Dashboard provides a real-time overview of payment operations.

### What you see

| Section | Description |
| ------- | ----------- |
| KPI cards | Revenue, transaction count, success rate, average ticket size |
| Revenue chart | Revenue trend over selected period |
| Payment methods | Breakdown by payment method type |
| Regional distribution | Geographic transaction distribution |
| High-value transactions | Recent large transactions |
| Activity feed | Recent platform events |
| Fraud alerts | Flagged suspicious activity |

### Period selection

Use the period selector (daily, weekly, monthly) to change the data range. Custom date ranges are available via `from` and `to` parameters.

### Export

Users with `dashboard:export` permission can export dashboard data as CSV via the export action.

### Dashboard AI

Users with `ai:chat` and `dashboard:read` permissions can ask questions about dashboard data using the AI panel on the dashboard page.

Example questions:

- "Summarize revenue trends this month"
- "What drove the spike last week?"

Quick actions (e.g., `summarize_revenue`) provide one-click analysis.

---

## Transactions

**Path:** `/transactions`

Manage payment transactions across all merchants.

### List view

- Search by transaction ID, merchant, customer, or amount
- Filter by status, date range, payment method
- View statistics summary (total count, volume, success rate)

### Transaction detail

Click a transaction to view:

- Amount, currency, status, payment method
- Merchant and customer information
- Timestamps (created, updated, settled)
- Related refunds and disputes

### Actions (permission-dependent)

| Action | Permission |
| ------ | ---------- |
| Create transaction | `transactions:write` |
| Update status | `transactions:write` |
| Export | `transactions:export` |
| Initiate refund | `refunds:write` |

---

## Merchants

**Path:** `/merchants`

Manage merchant accounts and KYC documentation.

### List view

- Search by name, ID, or status
- Filter by KYC status, risk level, business type, region
- View merchant statistics

### Merchant detail

- Business profile (legal name, display name, type)
- Contact information and addresses
- KYC status and risk level
- Associated transactions and settlements
- KYC documents

### Actions (permission-dependent)

| Action | Permission |
| ------ | ---------- |
| Create merchant | `merchants:write` |
| Edit merchant | `merchants:write` |
| Update status | `merchants:write` |
| Upload documents | `merchants:write` |
| Delete merchant | `merchants:delete` |

---

## Customers

**Path:** `/customers`

View and manage customer records linked to transactions.

### Features

- Customer search and list
- Customer detail with transaction history
- Associated merchants
- Customer statistics

Permissions: `customers:read`, `customers:write`, `customers:delete`

---

## Reports

**Path:** `/reports`

Access saved reports, analytics, and scheduled report delivery.

### Report types

| Section | Description |
| ------- | ----------- |
| Saved reports | Custom report definitions |
| Templates | Pre-built report templates |
| Scheduled reports | Automated report delivery |
| History | Past report executions |

### Analytics

The analytics section provides domain-specific views:

- Revenue, transactions, settlements, merchants, customers
- Refunds, chargebacks, payouts
- Payment links, invoices, QR payments, subscriptions
- Support and operations metrics

### Export

Users with `reports:export` or `analytics:export` can download report data as CSV.

---

## Refunds

**Path:** `/refunds`

Manage refund requests and approval workflow.

### Workflow

1. **Create** — Initiate refund from transaction detail or refunds list
2. **Review** — Pending refunds appear in the list with status
3. **Approve/Reject** — Approvers act on pending refunds
4. **History** — View status change history on refund detail

### Permissions

| Action | Permission |
| ------ | ---------- |
| View refunds | `refunds:read` |
| Create refund | `refunds:write` |
| Approve/reject | `refunds:approve` |

---

## Chargebacks

**Path:** `/chargebacks`

Manage payment disputes and chargeback resolution.

### Workflow

1. **Create** — Register a new chargeback against a transaction
2. **Evidence** — Upload supporting documentation
3. **Representment** — Submit representment to card network
4. **Resolve** — Mark outcome (won/lost) with notes

### Permissions

| Action | Permission |
| ------ | ---------- |
| View chargebacks | `chargebacks:read` |
| Create chargeback | `chargebacks:write` |
| Add evidence | `chargebacks:write` |
| Resolve | `chargebacks:resolve` |

---

## Settlements

**Path:** `/settlements`

Manage merchant settlement batches and individual settlements.

### Features

| Section | Description |
| ------- | ----------- |
| Settlements list | All settlements with status, amounts, merchant |
| Batches | Settlement batch grouping and processing |
| Statistics | Settlement volume and status breakdown |
| Export | CSV export of settlement data |

### Actions (permission-dependent)

| Action | Permission |
| ------ | ---------- |
| Create settlement | `settlements:write` |
| Create batch | `settlements:write` |
| Update status | `settlements:write` |
| Reverse settlement | `settlements:write` |
| Export | `settlements:export` |

---

## Support

**Path:** `/support`

Create and manage support tickets.

### Creating a ticket

1. Click **New Ticket**
2. Enter subject, description, category, and priority
3. Optionally link to a merchant
4. Submit — ticket appears in the list with "Open" status

### Ticket lifecycle

| Status | Description |
| ------ | ----------- |
| Open | Newly created |
| In Progress | Assigned and being worked |
| Escalated | Elevated priority/team |
| Closed | Resolved |
| Reopened | Previously closed, reactivated |

### Actions (permission-dependent)

| Action | Permission |
| ------ | ---------- |
| View tickets | `support:read` |
| Create/update | `support:write` |
| Assign/escalate/close | `support:manage` |

---

## Operations

**Path:** `/operations`

Operations center for platform monitoring and incident response.

### Dashboard panels

| Panel | Description |
| ----- | ----------- |
| System health | Application and infrastructure metrics |
| Alerts | Active operational alerts |
| Incidents | Open incidents |
| Retry queue | Failed operations awaiting retry |
| Background jobs | Scheduled and running jobs |
| Failed payments/payouts/webhooks | Error queues |

### Actions (permission-dependent)

| Action | Permission |
| ------ | ---------- |
| View operations data | `operations:read` |
| Acknowledge/resolve alerts | `operations:write` |
| Retry failed items | `operations:manage` |

---

## AI Assistant

The General AI Assistant is available via the floating action button (FAB) on any authenticated page.

### Permissions

Requires `ai:chat` permission.

### How to use

1. Click the AI FAB (bottom-right corner).
2. Type your question in the chat drawer.
3. The assistant responds using backend business data when applicable.

### Example questions

| Question | Behavior |
| -------- | -------- |
| "How many transactions today?" | Fetches transaction analytics, answers with actual count |
| "How many active merchants?" | Fetches merchant analytics |
| "What is a chargeback?" | General knowledge answer (no business data needed) |

### Business data rules

When backend data is available, the AI:

- Answers using actual data from the platform
- Never estimates or fabricates numbers
- Reports zero counts as zero
- States when data is unavailable

### Rate limits

AI requests are limited to 20 per minute per user (configurable by administrator via `AI_RATE_LIMIT_PER_MINUTE`).

---

## Dashboard AI

Dashboard AI is embedded in the Executive Dashboard page (separate from the general AI FAB).

### Differences from General AI

| Aspect | General AI | Dashboard AI |
| ------ | ---------- | ------------ |
| Location | FAB on all pages | Dashboard page panel |
| Context | Intent-based analytics | Dashboard period KPIs |
| Quick actions | No | Yes (summarize revenue, etc.) |

Both require `ai:chat` permission. Dashboard AI additionally requires `dashboard:read`.

---

## Notifications

**Path:** `/notifications`

View platform notifications and alerts assigned to your account.

- Inbox with read/unread status
- Notification details with timestamps
- Mark as read

---

## Settings (User)

Accessible via **Settings** in the sidebar.

| Page | Path | Description |
| ---- | ---- | ----------- |
| General | `/settings/general` | Profile and preferences |
| Notifications | `/settings/notifications` | Notification preferences |
| Account Security | `/settings/account` | Password change, MFA, sessions |

Organization-level settings (branding, security policy, feature flags) require `settings:read` permission. See [ADMIN_GUIDE.md](./ADMIN_GUIDE.md).

---

## Organization Selection

If you belong to multiple organizations, use **Select Organization** (`/select-organization`) to switch context. Your access token is updated with the selected organization ID, and all data views are scoped accordingly.

---

## Keyboard and Navigation Tips

- Use the sidebar to navigate between modules.
- Breadcrumbs show your current location within a module.
- Tables support pagination; use search and filter controls to narrow results.
- Export buttons download CSV files.

For permission issues (missing menu items or 403 errors), contact your administrator to verify role assignments.
